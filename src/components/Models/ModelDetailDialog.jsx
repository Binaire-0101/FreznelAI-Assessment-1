import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Heading,
  Text,
} from '@adobe/react-spectrum';
import { Model } from '../../models/Model.js';

/**
 * Detail view for a single model.
 *
 * Everything shown here comes from the local snapshot, so opening a model works
 * exactly the same offline. The only network-dependent affordance is the link
 * out to the model page, which is disabled when there is no connection rather
 * than leading to a browser error page.
 */
export function ModelDetailDialog({ model, online, onClose }) {
  return (
    <DialogContainer onDismiss={onClose} type="modal">
      {model ? (
        <Dialog size="L" UNSAFE_className="detail">
          <Heading UNSAFE_className="detail__title">{model.name}</Heading>
          <Text slot="header" UNSAFE_className="detail__author">
            {model.author}
          </Text>
          <Divider />
          <Content>
            <div className="detail__stats">
              <DetailStat label="Safetensor files" value={model.safetensorFiles} emphasis />
              <DetailStat label="Total files" value={model.fileCount} />
              <DetailStat label="Parameters" value={Model.formatParameters(model.parameters)} />
              <DetailStat label="Downloads" value={Model.formatCount(model.downloads)} />
              <DetailStat label="Likes" value={Model.formatCount(model.likes)} />
            </div>

            <dl className="detail__meta">
              <DetailRow label="Model id" value={model.id} mono />
              <DetailRow label="Pipeline tag" value={model.pipelineTag || '—'} />
              <DetailRow label="Family" value={model.family} />
              <DetailRow label="Architecture" value={model.architecture} />
              <DetailRow label="Library" value={model.library || '—'} />
              <DetailRow label="Weight tags" value={model.weightTags.join(', ')} />
              <DetailRow
                label="Last modified"
                value={model.lastModified ? new Date(model.lastModified).toLocaleDateString() : '—'}
              />
            </dl>

            {model.tags.length ? (
              <>
                <h4 className="detail__section">All tags</h4>
                <div className="detail__tags">
                  {model.tags.map((tag) => (
                    <span key={tag} className="tag tag--muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </Content>

          <ButtonGroup>
            <Button variant="secondary" onPress={onClose}>
              <Text>Close</Text>
            </Button>
            <Button
              variant="accent"
              isDisabled={!online}
              elementType="a"
              href={`https://huggingface.co/${model.id}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Text>{online ? 'Open model page' : 'Model page (offline)'}</Text>
            </Button>
          </ButtonGroup>
        </Dialog>
      ) : null}
    </DialogContainer>
  );
}

function DetailStat({ label, value, emphasis }) {
  return (
    <div className={`detail__stat ${emphasis ? 'detail__stat--emphasis' : ''}`}>
      <span className="detail__stat-value">{value}</span>
      <span className="detail__stat-label">{label}</span>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="detail__row">
      <dt>{label}</dt>
      <dd className={mono ? 'is-mono' : ''}>{value}</dd>
    </div>
  );
}
