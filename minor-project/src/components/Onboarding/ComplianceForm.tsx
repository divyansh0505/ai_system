import * as React from "react";
import styled from "@emotion/styled";
import Checkbox from "@/components/ui/Checkbox";
import { Label } from "@radix-ui/react-label";
import Button from "@/components/ui/Button";
import { Check } from "lucide-react";
import {
  FormBody,
  FormHeader,
  FormTitle,
  FormDescription,
  FormIconCircle,
  FormActions,
} from "./FormComponents";

type Compliance =
  | "SOC 2"
  | "ISO 27001"
  | "GDPR"
  | "HIPAA"
  | "PCI-DSS"
  | "OTHERS";

const OPTIONS: Compliance[] = [
  "SOC 2",
  "ISO 27001",
  "GDPR",
  "HIPAA",
  "PCI-DSS",
  "OTHERS",
];

const FormContent = styled.div({
  display: "grid",
  width: "100%",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "1.5rem",
});

const Row = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
});

const ItemLabel = styled(Label)({
  userSelect: "none",
  fontSize: "1.15rem",
  color: "#1F2937",
  cursor: "pointer",
  "&:hover": { color: "#111827" },
});

export interface ComplianceFormProps {
  onSubmit: (selected: Compliance[]) => void;
}

export function ComplianceForm({ onSubmit }: ComplianceFormProps) {
  const [selected, setSelected] = React.useState<Set<Compliance>>(new Set());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function toggle(value: Compliance, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value);
      else next.delete(value);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0 || isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(Array.from(selected));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <FormBody>
      <FormIconCircle backgroundColor="#16A34A">
        <Check size={28} color="#fff" />
      </FormIconCircle>
      <FormHeader>
        <FormTitle>Which compliances do you want to explore first?</FormTitle>
        <FormDescription>
          We’ll shape your experience around them
        </FormDescription>
      </FormHeader>
      <FormContent>
        {OPTIONS.map((option) => {
          const isChecked = selected.has(option);
          return (
            <Row key={option}>
              <Checkbox
                id={option}
                checked={isChecked}
                onKeyDown={handleKeyDown}
                onCheckedChange={(v) => toggle(option, v === true)}
                aria-label={option}
              />
              <ItemLabel htmlFor={option}>{option}</ItemLabel>
            </Row>
          );
        })}
      </FormContent>

      <FormActions>
        <Button
          css={{
            width: "100%",
          }}
          isLoading={isSubmitting}
          disabled={selected.size === 0 || isSubmitting}
          onClick={handleSubmit}
        >
          Interact Now
        </Button>
      </FormActions>
    </FormBody>
  );
}
