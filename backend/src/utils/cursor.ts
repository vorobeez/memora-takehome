export const encodeCursor = (cursor: unknown): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
};

export const decodeCursor = (encodedCursor: string): unknown => {
  return JSON.parse(Buffer.from(encodedCursor, 'base64url').toString('utf8'));
};
