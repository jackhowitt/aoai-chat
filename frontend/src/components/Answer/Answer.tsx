import { useEffect, useMemo, useState } from "react";
import { useBoolean } from "@fluentui/react-hooks";
import { FontIcon, Stack, Text } from "@fluentui/react";

import styles from "./Answer.module.css";

import { AskResponse, Citation } from "../../api";
import { parseAnswer } from "./AnswerParser";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supersub from "remark-supersub";

interface Props {
  answer: AskResponse;
  onCitationClicked: (citedDocument: Citation) => void;
}

export const Answer = ({ answer, onCitationClicked }: Props) => {
  const [isRefAccordionOpen, { toggle: toggleIsRefAccordionOpen }] =
    useBoolean(false);
  const filePathTruncationLimit = 100;

  const parsedAnswer = useMemo(() => parseAnswer(answer), [answer]);
  const [chevronIsExpanded, setChevronIsExpanded] =
    useState(isRefAccordionOpen);

  const handleChevronClick = () => {
    setChevronIsExpanded(!chevronIsExpanded);
    toggleIsRefAccordionOpen();
  };

  useEffect(() => {
    setChevronIsExpanded(isRefAccordionOpen);
  }, [isRefAccordionOpen]);

  const createCitationFilepath = (
    citation: Citation,
    index: number,
    truncate: boolean = false
  ) => {
    let citationFilename = "";

    if (citation.title && citation.title.length < 10 && citation.url) {
      // Extract filename from the URL and decode percent-encoded characters
      const urlParts = citation.url.split("/");
      const filenameWithExtension = decodeURIComponent(
        urlParts[urlParts.length - 1]
      );

      // Remove file extension and replace dashes or underscores with spaces
      citationFilename = filenameWithExtension
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
    } else {
      // Your existing logic for creating the filepath...
      if (citation.title && citation.chunk_id) {
        if (truncate && citation.title.length > filePathTruncationLimit) {
          const citationLength = citation.title.length;
          citationFilename = `${citation.title.substring(
            0,
            30
          )}...${citation.title.substring(citationLength - 30)}`;
        } else {
          citationFilename = `${citation.title}`;
        }
      } else if (citation.title && citation.reindex_id) {
        citationFilename = `${citation.title}`;
      } else {
        citationFilename = `Link ${index}`;
      }
    }

    return citationFilename;
  };

  const uniqueCitations = parsedAnswer.citations.filter(
    (citation, index, self) =>
      index === self.findIndex((c) => c.title === citation.title)
  );

  return (
    <>
      <Stack className={styles.answerContainer} tabIndex={0}>
        <Stack.Item grow>
          <ReactMarkdown
            linkTarget="_blank"
            remarkPlugins={[remarkGfm, supersub]}
            children={parsedAnswer.markdownFormatText}
            className={styles.answerText}
          />
        </Stack.Item>
        <Stack horizontal className={styles.answerFooter}>
          {!!parsedAnswer.citations.length && (
            <Stack.Item
              onKeyDown={(e) =>
                e.key === "Enter" || e.key === " "
                  ? toggleIsRefAccordionOpen()
                  : null
              }
            >
              <Stack style={{ width: "100%" }}>
                <Stack
                  horizontal
                  horizontalAlign="start"
                  verticalAlign="center"
                >
                  <Text
                    className={styles.accordionTitle}
                    onClick={toggleIsRefAccordionOpen}
                    aria-label="Open references"
                    tabIndex={0}
                    role="button"
                  >
                    <span>
                      {parsedAnswer.citations.length > 1
                        ? parsedAnswer.citations.length + " relevant links"
                        : "1 relevant link"}
                    </span>
                  </Text>
                  <FontIcon
                    className={styles.accordionIcon}
                    onClick={handleChevronClick}
                    iconName={
                      chevronIsExpanded ? "ChevronDown" : "ChevronRight"
                    }
                  />
                </Stack>
              </Stack>
            </Stack.Item>
          )}
          <Stack.Item className={styles.answerDisclaimerContainer}>
            <span className={styles.answerDisclaimer}>
              Our AI Chat can make mistakes. Consider checking important
              information.
            </span>
          </Stack.Item>
        </Stack>
        {chevronIsExpanded && (
          <div
            style={{
              marginTop: 8,
              marginBottom: 10,
              display: "flex",
              flexFlow: "wrap row",
              gap: "4px",
              width: "100%",
              paddingRight: 10,
              paddingLeft: 10,
            }}
          >
            {uniqueCitations.map((citation, idx) => {
              return (
                <span
                  title={createCitationFilepath(citation, ++idx)}
                  tabIndex={0}
                  role="link"
                  key={idx}
                  onClick={() => onCitationClicked(citation)}
                  onKeyDown={(e) =>
                    e.key === "Enter" || e.key === " "
                      ? onCitationClicked(citation)
                      : null
                  }
                  className={styles.citationContainer}
                  aria-label={createCitationFilepath(citation, idx)}
                >
                  {createCitationFilepath(citation, idx, true)}
                </span>
              );
            })}
          </div>
        )}
      </Stack>
    </>
  );
};
