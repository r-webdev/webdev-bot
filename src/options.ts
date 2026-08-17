import { OptionKey } from '@generated/prisma/enums.js';
import { prisma } from './db/prisma.js';

export type OptionValue = {
  value: string;
  type: 'string' | 'number' | 'boolean';
  displayName: string;
};

const OptionsDefaults = {
  [OptionKey.TAG_PREFIX]: {
    value: '$',
    type: 'string',
    displayName: 'Tag Prefix',
  },
  [OptionKey.MAX_TAGS_PER_MESSAGE]: {
    value: '5',
    type: 'number',
    displayName: 'Max Tags Per Message',
  },
} as const satisfies Record<OptionKey, OptionValue>;

export type OptionTypeOf<K extends OptionKey> =
  (typeof OptionsDefaults)[K]['type'];

export type ResolvedType<T extends OptionValue['type']> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : never;

export type ResolvedOption<K extends OptionKey> = Omit<OptionValue, 'value'> & {
  value: ResolvedType<OptionTypeOf<K>>;
};

export const BotOptions: Record<OptionKey, OptionValue> = {
  ...OptionsDefaults,
};

export const initBotOptions = async () => {
  for (const [key, option] of Object.entries(OptionsDefaults)) {
    const data = await prisma.options.upsert({
      where: { key: key as OptionKey },
      update: {},
      create: {
        key: key as OptionKey,
        value: option.value,
      },
    });
    BotOptions[data.key as OptionKey] = {
      value: data.value,
      type: option.type,
      displayName: option.displayName,
    };
  }
};

export const getBotOption = <K extends OptionKey>(
  key: K
): ResolvedOption<K> => {
  const option = BotOptions[key];

  const resolveValue = (): ResolvedType<OptionTypeOf<K>> => {
    switch (option.type) {
      case 'string':
        return option.value as ResolvedType<OptionTypeOf<K>>;
      case 'number':
        return Number(option.value) as ResolvedType<OptionTypeOf<K>>;
      case 'boolean':
        return (option.value === 'true') as ResolvedType<OptionTypeOf<K>>;
      default:
        throw new Error(`Unsupported option type: ${option.type as string}`);
    }
  };

  return {
    ...option,
    value: resolveValue(),
  };
};

export const setBotOption = async <K extends OptionKey>(
  key: K,
  value: string
) => {
  await prisma.options.update({
    where: { key },
    data: { value },
  });
  BotOptions[key].value = value;
  return getBotOption(key);
};
