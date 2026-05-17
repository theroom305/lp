import type {PublicFact} from "@/content/atlas";

type SourceStampProps = Readonly<{
  label: string;
  detail?: string;
}>;

export function SourceStamp({label, detail}: SourceStampProps) {
  return (
    <span className="source-stamp" data-test-id="source-stamp">
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
    </span>
  );
}

type SourceDrawerProps = Readonly<{
  facts: readonly PublicFact[];
}>;

export function SourceDrawer({facts}: SourceDrawerProps) {
  return (
    <details className="source-drawer" data-test-id="source-drawer">
      <summary>Source posture</summary>
      {facts.length > 0 ? (
        <ul>
          {facts.map((fact) => (
            <li key={fact.id}>
              <span>{fact.trustTier}</span>
              <p>{fact.text}</p>
              <small>{fact.confidence}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>Public source drawer placeholder. CC adds source packets in Step 3.5.</p>
      )}
    </details>
  );
}
