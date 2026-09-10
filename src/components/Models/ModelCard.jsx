import { memo } from 'react';
import { Model } from '../../models/Model.js';
import { highlightSegments } from '../../search/SearchEngine.js';

/**
 * One result card.
 *
 * Memoised because a keystroke re-renders the whole grid; the card only depends
 * on the model, the highlight query and its stagger index, all of which are
 * primitives or stable references.
 */
export const ModelCard = memo(function ModelCard({ model, query, index, onOpen }) {
  return (
    <article
      className="card"
      // The stagger is applied as a custom property so the animation lives
      // entirely in CSS and one card entering does not re-run the others.
      style={{ '--stagger': `${Math.min(index, 16) * 28}ms` }}
      tabIndex={0}
      role="button"
      onClick={() => onOpen(model)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(model);
        }
      }}
      aria-label={`${model.id}, ${model.safetensorFiles} safetensor files`}
    >
      <header className="card__head">
        <div className="card__author">{model.author || 'unknown'}</div>
        <h3 className="card__name">
          <Highlighted text={model.name} query={query} />
        </h3>
      </header>

      <div className="card__tags">
        {model.pipelineTag ? <span className="tag tag--pipeline">{model.pipelineTag}</span> : null}
        <span className="tag tag--family">
          <Highlighted text={model.family} query={query} />
        </span>
        {model.architecture ? <span className="tag tag--arch">{model.architecture}</span> : null}
      </div>

      <div className="card__weights">
        {model.weightTags.slice(0, 4).map((tag) => (
          <span key={tag} className="tag tag--weight">
            {tag}
          </span>
        ))}
        {model.weightTags.length > 4 ? (
          <span className="tag tag--weight tag--muted">+{model.weightTags.length - 4}</span>
        ) : null}
      </div>

      <footer className="card__stats">
        <Stat label="Safetensors" value={model.safetensorFiles} emphasis />
        <Stat label="Params" value={Model.formatParameters(model.parameters)} />
        <Stat label="Downloads" value={Model.formatCount(model.downloads)} />
        <Stat label="Likes" value={Model.formatCount(model.likes)} />
      </footer>
    </article>
  );
});

function Stat({ label, value, emphasis }) {
  return (
    <div className={`stat ${emphasis ? 'stat--emphasis' : ''}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

/** Renders the matched run in bold without any HTML injection. */
export function Highlighted({ text, query }) {
  const segments = highlightSegments(text, query);
  return (
    <>
      {segments.map((segment, index) =>
        segment.hit ? (
          <mark key={index} className="hl">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
