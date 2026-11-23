/**
 * Barrel export for all Mongoose models. Importing this module registers every
 * model with Mongoose exactly once, which is important for refs/population.
 */
export { Subject, type SubjectDoc } from "./Subject";
export { Topic, type TopicDoc } from "./Topic";
export { Conversation, type ConversationDoc } from "./Conversation";
export { Message, type MessageDoc } from "./Message";
export { Note, type NoteDoc } from "./Note";
export { AiProvider, type AiProviderDoc } from "./AiProvider";
export { AiProfile, type AiProfileDoc } from "./AiProfile";
export { Preference, type PreferenceDoc } from "./Preference";
export { Progress, type ProgressDoc } from "./Progress";
export { StudySession, type StudySessionDoc } from "./StudySession";
export { Pyq, type PyqDoc } from "./Pyq";
export { PyqAttempt, type PyqAttemptDoc } from "./PyqAttempt";
