import * as React from "react";
import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { type LucideIcon, MicIcon, MousePointerClick } from "lucide-react";

import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { config, DEFAULT_AGENT_IMAGE, FALLBACK_AGENT_NAME } from "@/lib/config";
import { useAssistantStore } from "@/store/assistantStore";
import { useStore } from "@/store";
import AgentMessageBubble from "@/modules/intro/components/AgentMessageBubble";
import EmailForm from "@/modules/intro/components/EmailForm";
import MobileHint from "@/modules/intro/components/MobileHint";
import useMessageAnimation from "@/modules/intro/hooks/useMessageAnimation";
import { type EmailCollection } from "@/utils/urlParams";

const Overlay = styled(motion.div)({
  position: "absolute",
  inset: 0,
  zIndex: 1200,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});

const Container = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "20px",
  zIndex: 2,
  width: "min(600px, calc(100vw - 2rem))",
});

const ChatContainer = styled(motion.div)({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "100%",
});

interface IntroMessage {
  text: string;
  icon: LucideIcon | null;
  showAvatar: boolean;
}

function getMessages(
  isPitch: boolean,
  organizationId: string,
  needsEmail: boolean,
): IntroMessage[] {
  const org = config.find((o) => o.id === organizationId);
  const agentName = org?.agent_name ?? FALLBACK_AGENT_NAME;

  const greeting: IntroMessage = {
    text: isPitch
      ? "Hi! Just a minute, I'm setting things up for you."
      : `Hi, I'm ${agentName}, your ${org?.name ?? FALLBACK_AGENT_NAME} guide!`,
    icon: null,
    showAvatar: true,
  };

  const emailPrompt: IntroMessage = {
    text: "Please share your email to unlock the experience. It is only used to tailor the experience. No spam, ever!",
    icon: null,
    showAvatar: false,
  };

  const loaderMessages: IntroMessage[] = [
    {
      text: "Talk using the mic button or simply ask your questions in the chat.",
      icon: MicIcon,
      showAvatar: false,
    },
    {
      text: isPitch
        ? "Watch the live pitch in real time."
        : "You can also interact with the platform in realtime.",
      icon: MousePointerClick,
      showAvatar: false,
    },
  ];

  if (needsEmail) {
    return [greeting, emailPrompt, ...loaderMessages];
  }
  return [greeting, ...loaderMessages];
}

interface IntroProps {
  organizationId: string;
  emailCollection: EmailCollection;
  hasToken: boolean;
  onEmailSubmit: (email: string | null) => Promise<void>;
  onComplete: () => void;
  connectError?: string;
}

function Intro({
  organizationId,
  emailCollection,
  hasToken,
  onEmailSubmit,
  onComplete,
  connectError,
}: IntroProps) {
  const [formReady, setFormReady] = React.useState(false);

  const isPitch = useStore((state) => state.widgetType === "pitch");
  const { isMobile } = useDeviceDetection();
  const agentVideoReady = useAssistantStore((s) => s.agentVideoReady);
  const emailSubmitted = useAssistantStore((state) => state.emailSubmitted);

  const requiresEmailCollection = emailCollection !== "none";

  const needsEmail = requiresEmailCollection && !emailSubmitted;

  const messages = React.useMemo(
    () => getMessages(isPitch, organizationId, requiresEmailCollection),
    [isPitch, organizationId, requiresEmailCollection],
  );

  const pauseAfterIndex = requiresEmailCollection ? 1 : undefined;

  const { states, allMessagesDone } = useMessageAnimation(messages.length, {
    pauseAfterIndex,
    resumed: hasToken,
  });

  const emailPromptVisible = needsEmail && states[1] === "visible";

  const showEmailForm = formReady && !hasToken;

  const shouldDismiss = allMessagesDone && agentVideoReady;

  React.useEffect(() => {
    if (!emailPromptVisible) return;
    const t = setTimeout(() => setFormReady(true), 400);
    return () => clearTimeout(t);
  }, [emailPromptVisible]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!shouldDismiss && (
        <Overlay
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
        >
          <Container>
            <ChatContainer layout>
              {states.map((state, i) => {
                if (state === "pending") return null;
                if (i === 1 && needsEmail && hasToken) return null;
                const msg = messages[i];
                return (
                  <AgentMessageBubble
                    key={i}
                    showAvatar={msg.showAvatar}
                    avatarSrc={msg.showAvatar ? DEFAULT_AGENT_IMAGE : undefined}
                    avatarAlt="Agent avatar"
                    state={state === "visible" ? "visible" : "typing"}
                    icon={state === "visible" ? msg.icon : null}
                    rowDelay={i === 0 ? 0.12 : 0}
                  >
                    {msg.text}
                  </AgentMessageBubble>
                );
              })}

              {showEmailForm && (
                <EmailForm
                  emailCollection={emailCollection}
                  onSubmit={onEmailSubmit}
                  connectError={connectError}
                />
              )}

              {allMessagesDone && !agentVideoReady && (
                <AgentMessageBubble key="video-wait" state="typing">
                  {""}
                </AgentMessageBubble>
              )}
            </ChatContainer>
          </Container>

          {isMobile && <MobileHint />}
        </Overlay>
      )}
    </AnimatePresence>
  );
}

export default React.memo(Intro);
