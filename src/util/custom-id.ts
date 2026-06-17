export const customId = (...parts: (string | number)[]) => parts.join(':');

export const parseCustomId = (id: string) => id.split(':');
