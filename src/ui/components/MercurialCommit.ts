import { exec } from 'child_process';

export const commitFile = (file: string, message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    exec(`hg commit -m "${message}" ${file}`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const createCommitOnSave = (file: string) => {
  return async (message: string) => {
    await commitFile(file, message);
  };
};

export const promptCommitMessage = (defaultMessage: string): string => {
  const result = window.prompt('Commit message', defaultMessage) || defaultMessage;
  return result;
};
