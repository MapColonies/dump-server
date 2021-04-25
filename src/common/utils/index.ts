export const isStringUndefinedOrEmpty = (input: string | undefined): boolean => {
  return input === undefined || input.length === 0;
};
