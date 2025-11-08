const { Schema, model } = require("mongoose");

const SessionSchema = new Schema(
  {
    userId: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model("Session", SessionSchema);
