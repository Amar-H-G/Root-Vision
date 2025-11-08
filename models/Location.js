const { Schema, model } = require("mongoose");

const LocationSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    userId: { type: String, default: null },
    point: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    accuracy: { type: Number, default: null },
    ts: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LocationSchema.index({ point: "2dsphere" });
LocationSchema.index({ sessionId: 1, ts: 1 });

module.exports = model("Location", LocationSchema);
