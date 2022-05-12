const EventSchema = new mongoose.Schema({
     name: {type: String, default: 'Anonmyous'},
     session_started: {type: Date, default: Date.now()},
     session_lasted: Date,
     event_owner_id: String,
     queue_status: {type: Boolean, default: false},
     current_queue: {type: Array, default: []},
     event_logger: Array
});


const Event = mongoose.model("Event", EventSchema);

module.exports = Event;