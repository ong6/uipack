// The parts bento's article tile: uipack/article's parts with the docs' Inference section
// (examples/articleParts.tsx), in a small prose column, scaled into the tile as an inert picture.
import { Callout, LayerHead, TermList } from "../../src/article";
import { inference } from "../../examples/articleParts";
import "../../src/article/article.css";

export default function ArticlePreview() {
  return (
    <div className="landing-article">
      <LayerHead {...inference.head} />
      <p className="landing-article__title">{inference.title}</p>
      <p>{inference.paragraphs[0]}</p>
      <TermList terms={inference.terms.slice(0, 3)} />
      <Callout kind="selftest">{inference.selftest}</Callout>
    </div>
  );
}
