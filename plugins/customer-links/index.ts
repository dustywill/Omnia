export type CustomerSite = {
  id: string;
  name: string;
  url: string;
};

export const scanCustomerSites = async (_filePath: string): Promise<CustomerSite[]> => {
  return [];
};
