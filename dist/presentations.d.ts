import * as react from 'react';
import { S as SpeechGuide } from './speech-BOroEnEA.js';
import { U as UiStyleId } from './style-DA3Lo6HE.js';

type PresentationTheme = "light" | "dark";

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
        applications: [{
            title: string;
            detail: string;
        }, {
            title: string;
            detail: string;
        }];
    };
}
interface SystemSlideStarter extends SlideStarterBase {
    layout: "system";
    content: {
        eyebrow: string;
        headline: string;
        steps: [{
            title: string;
            detail: string;
        }, {
            title: string;
            detail: string;
        }, {
            title: string;
            detail: string;
        }];
        caption: string;
    };
}
type SlideStarterData = OpeningSlideStarter | ExplanationSlideStarter | SystemSlideStarter;

interface SlideStarterProps {
    slide: SlideStarterData;
    theme?: PresentationTheme;
    /** The style it is painted in (sets data-ui-style); omitted, the nearest ancestor's, else Technical. */
    style?: UiStyleId;
    showSpeech?: boolean;
    className?: string;
    onCopySpeech?: (text: string) => void;
}
declare function SlideStarter({ slide, theme, style, showSpeech, className, onCopySpeech, }: SlideStarterProps): react.JSX.Element;

declare function estimateSpeechSeconds(say: string): number;
declare function formatSpeechGuide(speech: SpeechGuide): string;
interface SpeakerGuideProps {
    speech: SpeechGuide;
    slideTitle?: string;
    onCopy?: (text: string) => void;
    className?: string;
    theme?: PresentationTheme;
}
declare function SpeakerGuide({ speech, slideTitle, onCopy, className, theme }: SpeakerGuideProps): react.JSX.Element;

interface RenderSlideSvgOptions {
    theme?: PresentationTheme;
    width?: number;
    /**
     * "resolved" (default) writes Technical's literal colours and faces, for a standalone file. "css"
     * paints with the style roles (var(--ui-ink)…) in style attributes, so the SVG inlined in a page
     * follows the page's style and theme (SlideStarter does this).
     */
    paint?: "resolved" | "css";
}
declare function escapeSvgText(value: string): string;
declare function renderSlideSvg(slide: SlideStarterData, options?: RenderSlideSvgOptions): string;

export { type ExplanationSlideStarter, type OpeningSlideStarter, type PresentationTheme, type RenderSlideSvgOptions, type SlideFooter, SlideStarter, type SlideStarterData, type SlideStarterProps, SpeakerGuide, type SpeakerGuideProps, SpeechGuide, SpeechGuide as SpeechGuideData, type SystemSlideStarter, escapeSvgText, estimateSpeechSeconds, formatSpeechGuide, renderSlideSvg };
