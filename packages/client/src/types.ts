export type Packet = {
  id: string;
  name?: string;
  description?: string;
  data: string;
};

export type AnnotatedPacket = {
  id: string,
  name?: string,
  description?: string,
  data: string[],
  byteRanges: Record<ByteRange['id'], ByteRange>,
};

export type ByteRangeByte = {
  byteRangeId: ByteRange['id'];
  offset: string;
};

export type RenderablePacket = Omit<Packet, 'data'> & {
  data: string[][],
  byteRangeMap: Map<string, ByteRange>,
  byteRangeByteMap: Map<string, ByteRangeByte>,
};

export type ByteRange = {
  id: string;
  packetId: string;
  start: string;
  end: string;
  name: string;
  description: string;
  color: string;
  foregroundColor: string | undefined;
};

export type PickRenameMulti<T, R extends
{ [K in keyof R]: K extends keyof T ? PropertyKey : 'Error: key not in T' },
> = { [P in keyof T as P extends keyof R ? R[P] : P]: T[P] };
