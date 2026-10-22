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

export type { ExplanationSlideStarter as E, OpeningSlideStarter as O, PresentationTheme as P, SpeechGuide as S, SlideStarterData as a, SlideFooter as b, SystemSlideStarter as c };
