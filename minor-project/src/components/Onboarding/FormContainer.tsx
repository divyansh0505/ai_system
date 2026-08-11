import * as React from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { analytics } from "@/services/analytics";

import { ComplianceForm } from "./ComplianceForm";
import { EmailForm } from "./EmailForm";

import { defaultFlowChange } from "@/services/agentRPC";
import { useSessionStore } from "@/store/sessionStore";
import { useWidgetStateWithTransition } from "@/hooks/useWidgetStateWithTransition";

const StyledFormContainer = styled(motion.div)({
  overflow: "hidden",
  width: "100%",
  boxSizing: "border-box",
});

const FormCarousel = styled.div<{ activeIndex: number }>(
  {
    display: "flex",
    transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  (props) => ({
    transform: `translateX(-${props.activeIndex * 100}%)`,
  }),
);

const FormSlide = styled.div({
  width: "100%",
  padding: "32px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  flexShrink: 0,
});

function FormContainer({ widgetState }: { widgetState: string }) {
  const session = useSessionStore((state) => state.session);
  const hubspotutk = useSessionStore((state) => state.hubspotutk);
  const email = useSessionStore((state) => state.email);
  const setEmail = useSessionStore((state) => state.setEmail);
  const setWidgetState = useWidgetStateWithTransition();

  const submitDefaultFlow = React.useCallback(
    (email: string, selections: string[]) => {
      defaultFlowChange({
        user_id: session?.userId,
        user_email: email,
        default_flow: selections,
        hubspotutk: hubspotutk,
      });
      setWidgetState("active");
    },
    [hubspotutk, setWidgetState, session?.userId],
  );

  function handleEmailComplete(submittedEmail: string) {
    setEmail(submittedEmail);
    analytics.track("email_submitted", { email: submittedEmail });
    setWidgetState("compliance");
  }

  function handleComplianceComplete(selections: string[]) {
    analytics.trackCompliance("accepted");
    submitDefaultFlow(email, selections);
  }

  return (
    <StyledFormContainer
      layout
      transition={{
        layout: { type: "tween", duration: 0.35, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <FormCarousel activeIndex={widgetState === "compliance" ? 1 : 0}>
        <FormSlide>
          <EmailForm onSubmit={handleEmailComplete} />
        </FormSlide>
        <FormSlide>
          <ComplianceForm onSubmit={handleComplianceComplete} />
        </FormSlide>
      </FormCarousel>
    </StyledFormContainer>
  );
}

export default React.memo(FormContainer);
