import mayaImage from "/images/maya-image.png";

export const FALLBACK_AGENT_NAME = "Maya";
export const DEFAULT_AGENT_IMAGE = mayaImage;

export interface OrgConfig {
  id: string;
  name: string;
  agent_name: string;
  agent_image: string;
  onboarding: string[];
  demo_zoom?: number;
}

export const config: OrgConfig[] = [
  {
    id: "698061cae100a8004941c130",
    name: "Arize AX",
    agent_name: "Maya",
    agent_image: DEFAULT_AGENT_IMAGE,
    onboarding: ["email"],
    demo_zoom: 0.7,
  },
  {
    id: "68ee699745aa5eac0c93873e",
    name: "Sprinto",
    agent_name: "Maya",
    agent_image: DEFAULT_AGENT_IMAGE,
    onboarding: ["email", "compliance"],
    demo_zoom: 0.8,
  },
];
