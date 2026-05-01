import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@dynatrace/strato-components/buttons";
import { Container, Flex, Surface } from "@dynatrace/strato-components/layouts";
import {
  Heading,
  Paragraph,
  Text,
} from "@dynatrace/strato-components/typography";
import {
  RunQueryButton,
  type QueryStateType,
} from "@dynatrace/strato-components-preview/buttons";
import Borders from "@dynatrace/strato-design-tokens/borders";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Spacings from "@dynatrace/strato-design-tokens/spacings";
import { ClockIcon, LogsIcon } from "@dynatrace/strato-icons";

import { MockResultsTable } from "../components/MockResultsTable";
import { SmartDqlEditor } from "../components/SmartDqlEditor";

const INITIAL_QUERY = `fetch logs, from: now() - 24h
| parse content, "JSON:parsed"
| fieldsAdd app_id = parsed[log][app_id], event_type = parsed[log][event_type]
| filter isNotNull(app_id)
| `;

export const AutoLookup: React.FC = () => {
  const [query, setQuery] = useState<string>(INITIAL_QUERY);
  const [executedQuery, setExecutedQuery] = useState<string>("");
  const [queryState, setQueryState] = useState<QueryStateType>("idle");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (queryState !== "loading") return;
    const t = setTimeout(() => {
      setQueryState("success");
      setShowResults(true);
    }, 350);
    return () => clearTimeout(t);
  }, [queryState]);

  const onRunQuery = () => {
    if (queryState === "loading") return;
    setShowResults(false);
    setExecutedQuery(query);
    setQueryState("loading");
  };

  const recordCount = useMemo(() => (showResults ? 10 : 0), [showResults]);

  return (
    <Flex
      flexDirection="column"
      gap={16}
      style={{
        padding: Spacings.Size24,
        background: Colors.Background.Base.Default,
        minHeight: "100%",
      }}
    >
      <Flex flexDirection="column" gap={4}>
        <Flex alignItems="center" gap={12}>
          <img
            src="./assets/grail-logo.svg"
            alt="Grail"
            style={{
              height: 36,
              width: "auto",
              color: Colors.Text.Primary.Default,
            }}
          />
          <Heading level={3}>Grail Smart Lookups</Heading>
        </Flex>
        <Paragraph style={{ color: Colors.Text.Neutral.Subdued }}>
          Type <code>| lookup</code> in the editor. Grail offers matching
          lookup tables based on the fields already in your query. Then type{" "}
          <code>| fields</code> to pick from the union of your original fields
          and the lookup&apos;s prefixed fields.
        </Paragraph>
      </Flex>

      <Surface
        elevation="raised"
        style={{ padding: 0, borderRadius: Borders.Radius.Surface.Default }}
      >
        <Flex
          alignItems="center"
          justifyContent="space-between"
          style={{
            padding: `${Spacings.Size12} ${Spacings.Size16}`,
            borderBottom: `${Borders.Width.Default} ${Borders.Style.Default} ${Colors.Border.Neutral.Default}`,
          }}
        >
          <Flex alignItems="center" gap={8}>
            <LogsIcon />
            <Text>Logs</Text>
          </Flex>
          <Flex alignItems="center" gap={8}>
            <Container
              as={Flex}
              alignItems="center"
              gap={4}
              style={{
                padding: `${Spacings.Size4} ${Spacings.Size12}`,
                background: Colors.Background.Container.Neutral.Default,
                borderRadius: Borders.Radius.Field.Emphasized,
                fontSize: 12,
                color: Colors.Text.Neutral.Subdued,
              }}
            >
              <ClockIcon />
              <span>Last 24 hours</span>
            </Container>
            <RunQueryButton onClick={onRunQuery} queryState={queryState} />
          </Flex>
        </Flex>

        <div style={{ padding: Spacings.Size12 }}>
          <SmartDqlEditor value={query} onChange={setQuery} />
        </div>
      </Surface>

      <Surface
        elevation="raised"
        style={{ padding: 0, borderRadius: Borders.Radius.Surface.Default }}
      >
        <Flex
          alignItems="center"
          justifyContent="space-between"
          style={{
            padding: `${Spacings.Size8} ${Spacings.Size16}`,
            borderBottom: `${Borders.Width.Default} ${Borders.Style.Default} ${Colors.Border.Neutral.Default}`,
          }}
        >
          <Flex alignItems="center" gap={12}>
            <Text style={{ fontWeight: 600 }}>Search results</Text>
            {showResults && (
              <Container
                as="span"
                style={{
                  padding: `2px ${Spacings.Size8}`,
                  borderRadius: Borders.Radius.Field.Emphasized,
                  background: Colors.Background.Container.Primary.Emphasized,
                  color: Colors.Text.Primary.Default,
                  fontSize: 12,
                }}
              >
                {recordCount} records
              </Container>
            )}
          </Flex>
          <Button
            variant="default"
            onClick={() => {
              setQuery(INITIAL_QUERY);
              setExecutedQuery("");
              setShowResults(false);
              setQueryState("idle");
            }}
          >
            Reset demo
          </Button>
        </Flex>
        <div style={{ padding: Spacings.Size12 }}>
          {!showResults ? (
            <Paragraph
              style={{
                color: Colors.Text.Neutral.Subdued,
                padding: `${Spacings.Size16} ${Spacings.Size4}`,
              }}
            >
              Click <strong>Run query</strong> to see how the lookup enriches
              your logs.
            </Paragraph>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <MockResultsTable query={executedQuery} />
            </div>
          )}
        </div>
      </Surface>
    </Flex>
  );
};
