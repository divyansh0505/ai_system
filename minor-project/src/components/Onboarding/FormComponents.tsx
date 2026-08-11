import styled from "@emotion/styled";

export const FormHeader = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

export const FormTitle = styled.h2({
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: 1.2,
  textAlign: "center",
  color: "#09090b",
  margin: 0,
});

export const FormDescription = styled.p({
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: 1.5,
  color: "#71717a",
  textAlign: "center",
  margin: 0,
});

export const FormBody = styled.div({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "32px",
});

export const FormIconCircle = styled.div<{ backgroundColor: string }>(
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    borderRadius: "999px",
  },
  (props) => ({
    backgroundColor: props.backgroundColor,
  }),
);

export const FormActions = styled.div({
  width: "100%",
});
