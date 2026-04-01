/**
 * Questions module — barrel exports.
 */

export {
	questionCollectionTable,
	questionTable,
	answerTable,
	QUESTIONS_GUEST_SEED,
} from './collections';
export * from './queries';
export type {
	LocalCollection,
	LocalQuestion,
	LocalAnswer,
	QuestionStatus,
	QuestionPriority,
	ResearchDepth,
	CreateQuestionDto,
	UpdateQuestionDto,
	CreateCollectionDto,
	UpdateCollectionDto,
} from './types';
