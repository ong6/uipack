import * as react from 'react';

type PresentationTheme = "light" | "dark";
interface SpeechGuide {
    /** The words to say. Keep this conversational and short enough for one slide. */
    say: string;
    /** One practical cue for pace, emphasis, or where to direct attention. */
    delivery: string;
    /** Optional bridge into the following slide. */
    next?: string;
}
interface SlideFooter {
    label: string;
    page?: string;
}
interface SlideStarterBase {
    id: string;
    title: string;
    description: string;
    speech: SpeechGuide;
    footer?: SlideFooter;
}
interface OpeningSlideStarter extends SlideStarterBase {
    layout: "opening";
    content: {
        eyebrow: string;
        headline: [string, string];
        context: string;
    };
}
interface ExplanationSlideStarter extends SlideStarterBase {
    layout: "explanation";
    content: {
        eyebrow: string;
        headline: string;
        foundation: {
            title: string;
            detail: string;
        };
        applications: [
            {
                title: string;
                detail: string;
            },
            {
                title: string;
                detail: string;
            }
        ];
    };
}
interface SystemSlideStarter extends SlideStarterBase {
    layout: "system";
    content: {
        eyebrow: string;
        headline: string;
        steps: [
            {
                title: string;
                detail: string;
            },
            {
                title: string;
                detail: string;
            },
            {
                title: string;
                detail: string;
            }
        ];
        caption: string;
    };
}
type SlideStarterData = OpeningSlideStarter | ExplanationSlideStarter | SystemSlideStarter;

interface SlideStarterProps {
    slide: SlideStarterData;
    theme?: PresentationTheme;
    showSpeech?: boolean;
    className?: string;
    onCopySpeech?: (text: string) => void;
}
declare function SlideStarter({ slide, theme, showSpeech, className, onCopySpeech, }: SlideStarterProps): react.JSX.Element;

declare function estimateSpeechSeconds(say: string): number;
declare function formatSpeechGuide(speech: SpeechGuide): string;
interface SpeakerGuideProps {
    speech: SpeechGuide;
    slideTitle?: string;
    onCopy?: (text: string) => void;
    className?: string;
    theme?: PresentationTheme;
}
declare function SpeakerGuide({ speech, slideTitle, onCopy, className, theme, }: SpeakerGuideProps): react.JSX.Element;

interface RenderSlideSvgOptions {
    theme?: PresentationTheme;
    width?: number;
}
declare function escapeSvgText(value: string): string;
declare function renderSlideSvg(slide: SlideStarterData, options?: RenderSlideSvgOptions): string;

export { type ExplanationSlideStarter, type OpeningSlideStarter, type PresentationTheme, type RenderSlideSvgOptions, type SlideFooter, SlideStarter, type SlideStarterData, type SlideStarterProps, SpeakerGuide, type SpeakerGuideProps, type SpeechGuide, type SpeechGuide as SpeechGuideData, type SystemSlideStarter, escapeSvgText, estimateSpeechSeconds, formatSpeechGuide, renderSlideSvg };
