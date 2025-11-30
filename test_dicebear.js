import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const avatar = createAvatar(adventurer, {
    seed: 'test-seed',
    size: 100,
    // No outfit prop
});

console.log(avatar.toString());
