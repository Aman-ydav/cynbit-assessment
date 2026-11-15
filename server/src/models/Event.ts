import { Schema, model, type InferSchemaType } from "mongoose";

const EVENT_RETENTION_SECONDS = 60 * 60 * 24 * 180; // 180 days

/**
 * Anonymous funnel events. `sessionId` is a random per-tab id generated in the browser —
 * it is not linked to any person, cookie or device identifier.
 */
const eventSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    props: { type: Schema.Types.Mixed },
    // TTL index: events are deleted automatically after the retention period.
    createdAt: { type: Date, default: Date.now, expires: EVENT_RETENTION_SECONDS },
  },
  { versionKey: false },
);

export type EventDoc = InferSchemaType<typeof eventSchema>;
export const EventModel = model("Event", eventSchema);
