/** A slide's talk track: the words, how to deliver them, and the bridge to the next slide. */
interface SpeechGuide {
    /** The words to say. Keep this conversational and short enough for one slide. */
    say: string;
    /** One practical cue for pace, emphasis, or where to direct attention. */
    delivery: string;
    /** Optional bridge into the following slide. */
    next?: string;
}
/** Speaking pace for timing a talk track: a steady presenting pace, slower than conversation. */
declare const WORDS_PER_MINUTE = 135;

export { type SpeechGuide as S, WORDS_PER_MINUTE as W };
