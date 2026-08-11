import API from "@/lib/api";

export interface Assistant {
  id: string;
  externalId: string;
  name: string;
  meta: object;
}

interface CustomerData {
  data: {
    customer: {
      id: string;
      createdAt: string;
      domain: string;
      assistant: Assistant;
      meta: object;
      updatedAt: string;
    };
    message: string;
  };
}

export async function getCustomerData(domain: string): Promise<CustomerData> {
  const response = await API.get(`/customer?domain=${domain}`);
  return response.data;
}
