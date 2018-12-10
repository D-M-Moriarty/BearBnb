// Reference Mongoose to use the library functions
let mongoose = require("mongoose");

// A schema definition for the geolocation of a property
const geoSchema = new mongoose.Schema({
    type: {
        // property type of String
        type: String,
        // default value of "Point"
        default: "Point"
    },
    // property name "coordinates"
    coordinates: {
        // property type of array of Numbers
        type: [Number],
        index: "2dsphere"
    }
});

// Schema definition for a property to be 
// inserted to the properties collection
const propertySchema = new mongoose.Schema({
    typeOfPlace: String,
    numOfGuests: Number,
    county: String,
    typeOfDwelling: String,
    propertyType: String,
    guestRoamingScope: String,
    dedicatedGuestSpace: Boolean,
    maxNumGuests: Number,
    numUseableBeds: Number,
    bedrooms: [{
        double: Number,
        queen: Number,
        single: Number,
        sofaBed: Number
    }],
    bathrooms: Number,
    location: {
        country: String,
        houseName: String,
        st: String,
        town: String,
        county: String,
        postcode: String
    },
    amenities: {
        essentials: Boolean,
        WiFi: Boolean,
        shampoo: Boolean,
        closet: Boolean,
        tv: Boolean,
        heat: Boolean,
        airCon: Boolean,
        breakfast: Boolean,
        desk: Boolean,
        fireplace: Boolean,
        iron: Boolean,
        hairDryer: Boolean,
        petsAllowed: Boolean,
        privateEntrance: Boolean,
        safetyAmenities: {
            smokeDetector: Boolean,
            carbonMonoxide: Boolean,
            firstAid: Boolean,
            safetyCard: Boolean,
            fireExtinguisher: Boolean,
            lockOnDooorRoom: Boolean
        }
    },
    usabeSpaces: {
        pool: Boolean,
        kitchen: Boolean,
        laundry: Boolean,
        parking: Boolean,
        lift: Boolean,
        hotTub: Boolean,
        gym: Boolean
    },
    homePicture: {
        type: String,
        default: "https://placebear.com/640/360"
    },
    description: String,
    nameOfHouse: String,
    houseRules: {
        suitChild2to12: Boolean,
        under2: Boolean,
        smokingAllowed: Boolean,
        partiesAllowed: Boolean,
        additional: String
    },
    minNights: Number,
    maxNights: Number,
    pricing: {
        basePrice: Number,
        minPrice: Number,
        maxPrice: Number,
        currency: String
    },
    host: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Host"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    geometry: geoSchema
});

// creates model by calling the model constructor on the Mongoose instance
// and passing it the name of the collection and reference to the schema
// definition and then exporting it
module.exports = mongoose.model("Property", propertySchema);