export const isStringUndefinedOrEmpty = (input: string | undefined): input is undefined => {
  return input === undefined || input.length === 0;
};
