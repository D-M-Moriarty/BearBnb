var express = require("express");
var router = express.Router();
var Property = require("../models/property");
var Comment = require("../models/comment");
var middleware = require("../middleware");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");
const crypto = require("crypto");
const expressip = require("express-ip");

mongoose.set("debug", true);

router.use(expressip().getIpInfoMiddleware);
var url = "mongodb://127.0.0.1:27017/Bearbnb";
const conn = mongoose.createConnection(url, {
  useNewUrlParser: true
});

// init gfs
let gfs;
// open a connection to MongoDB and create an uploads collection
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});
// filters files that uploaded from the browser
const fileFilter = (req, file, cb) => {
  file.mimetype == "image/jpeg" || file.mimetype == "image/png"
    ? cb(null, true)
    : cb(null, false);
};
// store the file with a cryptographic name
const storage = new GridFsStorage({
  url: url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
// user multer as a middleware when a property is being uploaded
const upload = multer({
  storage,
  fileFilter: fileFilter
});

// @route FET /image/:filename
router.get("/image/:houseImage", (req, res) => {
  // finds an image by its name
  gfs.files.findOne(
    {
      filename: req.params.houseImage
    },
    (err, file) => {
      // check if file exists
      if (!file || file.length === 0) {
        res.status(404).json({
          err: "no file found"
        });
      }
      // checks if its the correct format
      if (
        file.contentType === "image/jpeg" ||
        file.contentType === "image/png"
      ) {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: "not image"
        });
      }
    }
  );
});

// INDEX - show all properties by distance from client
router.get("/", (req, res) => {
  // getting the ip information from the clients machine
  const ipInfo = req.ipInfo;
  // using the mongo aggregation framework to retrieve
  // the properties, sorted by their distance
  // from the users geolocation
  Property.aggregate()
    .near({
      near: {
        type: "Point",
        // ipInfo.ll is the users latitude and longitude
        coordinates: ipInfo.ll
      },
      // spherical: true takes into account the curviture
      // of the earth
      spherical: true,
      distanceField: "dist.calculated",
      // the max distance a property can be from the
      // user / client machine in Kilometers
      maxDistance: 10000000 / 2 // in KM
    })
    .then(allProperties => {
      let ifs = "";
      for (var i = 0; i < allProperties.length; i++) {
        ifs += "this._id == '" + allProperties[i]._id + "' || ";
      }

      ifs = ifs.substr(0, ifs.length - 4);

      //   let map = () => {
      //     // loop though all the properties that were returned from the
      //     // geonear query
      //     for (var i = 0; i < allProperties.length; i++)
      //       // if the id of the current document matches one of the
      //       // allProperties ids then emit the document
      //       if (this._id == allProperties[i]) emit(this, 1);
      //   };
      // define the mapreduce options object
      let o = {};
      // map function
      o.map =
        "function (){for (var i = 0; i < " +
        allProperties.length +
        "; i++) { if(" +
        ifs +
        " ){ emit(this, 1);}}}";
      // reduce function
      o.reduce = "function(key, values){return values.length;}";
      o.verbose = false;
      // return the values as an array
      o.out = {
        inline: 1
      };
      // calling the mapreduce on the properties collection
      Property.mapReduce(o, (err, results) => {
        if (err) console.log(err);
        console.log(results.length + " is the result");
        // render the index page and pass all the properties to be listed
        // and the count of those properties from the mapreduce
        res.render("properties", {
          properties: allProperties,
          count: results.length
        });
      });
      // a query that matches multiple expressions
      var query = {
        $or: []
      };
      // gets all the property ids from the properties
      // within the selected distance
      //   for (var i = 0; i < allProperties.length; i++) {
      //     query["$or"].push({
      //       _id: allProperties[i]._id
      //     });
      //   }
      //   //more efficient
      //   Property.countDocuments(query, (err, count) => {
      //     if (err) console.log(err);
      //     // display all the properites
      //     // sorted by distance from user
      //     // pass the count of the documents
      //     res.render("properties", {
      //       properties: allProperties,
      //       count: count
      //     });
      //   });

      // aggregation query
      // Property.count({
      //     properties: allProperties
      // }, (err, count) => {
      //     if (err) console.log(err);
      //     // display all the properites
      //     // sorted by distance from user
      //     // pass the count of the documents
      //     res.render("properties", {
      //         properties: allProperties,
      //         count: count
      //     });
      // });
    })
    .catch(err => {
      console.log(err);
    });
});

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles (default)                         :::
//:::                  'K' is kilometers                                      :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at https://www.geodatasource.com                          :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: https://www.geodatasource.com                        :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2017            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function distance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = (Math.PI * lat1) / 180;
  var radlat2 = (Math.PI * lat2) / 180;
  var theta = lon1 - lon2;
  var radtheta = (Math.PI * theta) / 180;
  var dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  if (unit == "K") {
    dist = dist * 1.609344;
  }
  if (unit == "N") {
    dist = dist * 0.8684;
  }
  return dist;
}

// Create Route
router.post(
  "/",
  middleware.isLoggedIn,
  upload.single("homePicture"),
  (req, res) => {
    // defining the user object, which will in this case be the host of the property
    let host = {
      // the username and id are retrieved from the POST request
      id: req.user._id,
      username: req.user.username
    };
    // all of the fields of the mongoose model are filled out from the
    // POST requests body fields
    let newProperty = new Property({
      typeOfPlace: req.body.typeOfPlace,
      typeOfDwelling: req.body.typeOfDwelling,
      propertyType: req.body.propertyType,
      guestRoamingScope: req.body.guestRoamingScope,
      partOfCompany: req.body.partOfCompany,
      dedicatedGuestSpace: req.body.dedicatedGuestSpace,
      maxNumGuests: req.body.maxNumGuests,
      numUseableBeds: req.body.numUseableBeds,
      bedrooms: [
        {
          double: req.body.double,
          queen: req.body.queen,
          single: req.body.single,
          sofaBed: req.body.sofaBed
        }
      ],
      bathrooms: req.body.bathrooms,
      location: {
        country: req.body.country,
        houseName: req.body.houseName,
        st: req.body.st,
        town: req.body.town,
        county: req.body.county,
        postcode: req.body.postcode
      },
      amenities: {
        essentials: req.body.essentials,
        WiFi: req.body.WiFi,
        shampoo: req.body.shampoo,
        closet: req.body.closet,
        tv: req.body.tv,
        heat: req.body.heat,
        airCon: req.body.airCon,
        breakfast: req.body.breakfast,
        desk: req.body.desk,
        fireplace: req.body.fireplace,
        iron: req.body.iron,
        hairDryer: req.body.hairDryer,
        petsAllowed: req.body.petsAllowed,
        privateEntrance: req.body.privateEntrance,
        safetyAmenities: {
          smokeDetector: req.body.smokeDetector,
          carbonMonoxide: req.body.carbonMonoxide,
          firstAid: req.body.firstAid,
          safetyCard: req.body.safetyCard,
          fireExtinguisher: req.body.fireExtinguisher,
          lockOnDooorRoom: req.body.lockOnDooorRoom
        }
      },
      usabeSpaces: {
        pool: req.body.pool,
        kitchen: req.body.kitchen,
        laundry: req.body.laundryWasher,
        laundry: req.body.laundryDryer,
        parking: req.body.parking,
        lift: req.body.lift,
        hotTub: req.body.hotTub,
        gym: req.body.gym
      },
      homePicture: req.file.filename,
      description: req.body.description,
      nameOfHouse: req.body.nameOfHouse,
      houseRules: {
        suitChild2to12: req.body.suitChild2to12,
        under2: req.body.under2,
        pets: req.body.pets,
        smokingAllowed: req.body.smokingAllowed,
        partiesAllowed: req.body.partiesAllowed,
        additional: req.body.additional
      },
      minNights: req.body.minNights,
      maxNights: req.body.maxNights,
      pricing: {
        basePrice: req.body.basePrice,
        minPrice: req.body.minPrice,
        maxPrice: req.body.maxPrice,
        currency: req.body.currency
      },
      host: host,
      geometry: {
        // the geometry object coordinates are retrieved from
        // the hosts browsers geolocation
        type: "point",
        coordinates: [req.body.long, req.body.lat]
      }
    });
    // the property model is then saved to mongoDB with mongoose
    newProperty
      .save()
      .then(() => {
        // if the save was successful, the host is redirected to the index page
        res.redirect("/properties");
      })
      .catch(err => {
        // if an error occurs we console it out
        console.log(err);
      });
  }
);

// New Route
router.get("/new", middleware.isLoggedIn, (req, res) => {
  res.render("properties/new");
});

// SHOW - shows more info about one property
router.get("/:id", (req, res) => {
  // Find the property with provided ID
  Property.findById(req.params.id)
    // populate the comments on the page if they exist
    .populate("comments")
    .exec((err, foundProperty) => {
      // mapreduce to find how old a comment is
      let map = () => {
        // getting the difference in miliseconds between now
        // comment creation time
        var diff = new Date() - this.dateCreated;
        // checking the comment id matches
        if (this._id == req.params.id) {
          // checking if the miliseconds are more than a day
          if (diff > 24 * (60 * 60000)) {
            diff /= 24 * (60 * 60000);
            // emit the time and unit
            emit(this._id, { diff: diff, unit: "days" });
            // checking if the miliseconds are more than an hour
          } else if (diff > 60 * 60000) {
            diff /= 60 * 60000;
            // emit the time and unit
            emit(this._id, { diff: diff, unit: "hours" });
            // checking if the miliseconds are more than a minute
          } else if (diff > 60000) {
            diff /= 60000;
            // emit the time and unit
            emit(this._id, { diff: diff, unit: "minutes" });
          }
        }
      };
      let reduce = function(key, values) {
        return values;
      };
      let o = {};
      // map function
      o.map =
        "function(){var diff = new Date() - this.dateCreated; if (this._id == '" +
        str +
        "') { if (diff > (24 * (60 * 60000))) { diff /= (24 *(60 * 60000)); emit(this._id, { diff: diff, unit: 'days' }); } else if (diff > (60 * 60000)) { diff /= (60 * 60000); emit(this._id, { diff: diff, unit: 'hours' }); } else if (diff > 60000) { diff /= 60000; emit(this._id, { diff: diff, unit: 'minutes' }); } }}";
      // reduce function
      o.reduce = "function(key, values){return values;}";
      o.verbose = false;
      // return the values as an array
      o.out = {
        inline: 1
      };

      //console.log(foundProperty);

      if (err) {
        console.log(err);
      } else {
        // calling the mapreduce on the comments collection
        Comment.mapReduce(o, (err, results) => {
          if (err) console.log(err);
          // render the time  and unit
          res.render("properties/showProperty", {
            property: foundProperty,
            time: parseInt(results[0].value.diff),
            unit: results[0].value.unit
          });
        });
      }
    });
});

// Edit Property Route
router.get("/:id/edit", middleware.checkPropertyOwnership, (req, res) => {
  Property.findById(req.params.id, (err, foundProperty) => {
    res.render("properties/edit", {
      property: foundProperty
    });
  });
});

// Update Property Route
router.put("/:id", middleware.checkPropertyOwnership, (req, res) => {
  // find and update the correct property by its id
  Property.findByIdAndUpdate(req.params.id, req.body.property)
    .then(() => {
      res.redirect("/properties/" + req.params.id);
    })
    .catch(err => {
      console.log(err);
      res.redirect("/properties/");
    });
});

// Destroy Route
router.delete("/:id", middleware.checkPropertyOwnership, (req, res) => {
  // finds the property based on its id and deletes it from the database
  Property.findByIdAndRemove(req.params.id)
    .then(() => {
      res.redirect("/properties/");
    })
    .catch(err => {
      console.log(err);
      res.redirect("/properties/");
    });
});

module.exports = router;
