import * as React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import { Unlock, ArrowRightIcon, Mail } from "lucide-react";
import {
  FormBody,
  FormHeader,
  FormTitle,
  FormDescription,
  FormIconCircle,
  FormActions,
} from "./FormComponents";
import { enrichUser } from "@/services/auth";
import { useSessionStore } from "@/store/sessionStore";
import { validateEmail, BLOCKED_DOMAINS } from "@/utils/validation";
import styled from "@emotion/styled";

const FormSectionStack = styled.div({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
});

const FormFieldRow = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
});

const FormErrorMessage = styled.span({
  display: "block",
  color: "#D14343",
  fontSize: "0.875rem",
  transition: "color 0.15s",
});

export interface EmailFormProps {
  onSubmit: (email: string) => void;
}

export function EmailForm({ onSubmit }: EmailFormProps) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  const { valid, errorMessage } = validateEmail(email, {
    blockGenericDomains: true,
    blockedDomains: BLOCKED_DOMAINS,
  });

  const sessionId = useSessionStore((state) => state.session?.sessionId);
  const hubspotutk = useSessionStore((state) => state.hubspotutk);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!valid) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);

    if (sessionId) {
      try {
        await enrichUser(email, sessionId, hubspotutk);
      } catch (error) {
        console.error("Error enriching user:", error);
        setIsSubmitting(false);
        return;
      }
    }

    onSubmit(email);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (showError) {
      setShowError(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <FormBody>
      <FormIconCircle backgroundColor={"#f4f4f5"}>
        <Unlock size={24} color="#27272a" />
      </FormIconCircle>
      <FormHeader>
        <FormTitle>Unlock the interactive experience</FormTitle>
        <FormDescription>
          No Spam. Email is only used to personalise your experience
        </FormDescription>
      </FormHeader>
      <FormSectionStack>
        <FormFieldRow>
          <Input
            id="work-email"
            type="email"
            placeholder="Enter your email"
            leftSection={<Mail size={16} />}
            value={email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
            required
            aria-invalid={showError && !valid ? true : undefined}
            aria-describedby="work-email-error"
            css={{ flex: 1 }}
          />
        </FormFieldRow>
        <FormErrorMessage id="work-email-error" role="alert" aria-live="polite">
          {showError && (
            <span>{errorMessage ?? "Please enter your work email."}</span>
          )}
        </FormErrorMessage>
      </FormSectionStack>

      <FormActions>
        <Button
          css={{
            width: "100%",
          }}
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          Proceed
          <ArrowRightIcon css={{ marginRight: "0.75rem", height: "1.25rem" }} />
        </Button>
      </FormActions>
    </FormBody>
  );
}
