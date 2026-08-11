import * as React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/input";
import { type EmailCollection } from "@/utils/urlParams";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { Mail, SkipForwardIcon, Video } from "lucide-react";

const FormWrapper = styled(motion.div)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  position: "relative",
  paddingLeft: "60px",
  marginTop: "12px",
});

const InputRow = styled.div({
  display: "flex",
  alignItems: "stretch",
  gap: "8px",
  width: "100%",
});

const ErrorText = styled.p(({ theme }) => ({
  color: theme.colors.destructive,
  fontSize: "13px",
  margin: 0,
  position: "absolute",
  top: "100%",
  left: "60px",
  paddingTop: "4px",
}));

const SkipButton = motion(
  styled(Button)({
    position: "absolute",
    top: "16px",
    right: "16px",
    gap: "6px",
  }),
);

const Spinner = styled.div({
  width: "18px",
  height: "18px",
  border: "2px solid #e5e7eb",
  borderTopColor: "#5154ef",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  "@keyframes spin": {
    to: { transform: "rotate(360deg)" },
  },
});

const formSpring = {
  type: "spring",
  stiffness: 320,
  damping: 24,
} as const;

import { validateEmail } from "@/utils/validation";

export interface EmailFormProps {
  emailCollection: EmailCollection;
  onSubmit: (email: string | null) => Promise<void>;
  connectError?: string;
}

const EmailForm: React.FC<EmailFormProps> = ({
  emailCollection,
  onSubmit,
  connectError,
}) => {
  const [email, setEmail] = React.useState("");
  const [validationError, setValidationError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const displayError = validationError || connectError;

  const handleSubmit = React.useCallback(async () => {
    const trimmed = email.trim();
    const { valid, errorMessage } = validateEmail(trimmed);
    if (!valid) {
      setValidationError(errorMessage ?? "Please enter a valid email address");
      return;
    }
    setValidationError("");
    setIsLoading(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setIsLoading(false);
    }
  }, [email, onSubmit]);

  const handleSkip = React.useCallback(async () => {
    setValidationError("");
    setIsLoading(true);
    try {
      await onSubmit(null);
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (validationError) setValidationError("");
    },
    [validationError],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  return (
    <>
      {emailCollection === "optional" && !connectError && (
        <SkipButton
          onClick={handleSkip}
          variant="outline"
          disabled={isLoading}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.28 }}
        >
          <SkipForwardIcon size={14} />
          Skip
        </SkipButton>
      )}

      <FormWrapper
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...formSpring, delay: 0.15 }}
      >
        <InputRow>
          <Input
            type="email"
            placeholder="Enter your email"
            leftSection={<Mail size={16} />}
            value={email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus={true}
            disabled={isLoading}
          />
          <Button
            css={{ gap: 8, whiteSpace: "nowrap" }}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : <Video />}
            {isLoading ? "Verifying" : "Join call"}
          </Button>
        </InputRow>

        {displayError && <ErrorText>{displayError}</ErrorText>}
      </FormWrapper>
    </>
  );
};

export default EmailForm;
