import moduleAlias from 'module-alias';
import path from 'path';

// Explicitly alias expo-constants to our mock
moduleAlias.addAlias('expo-constants', path.resolve(process.cwd(), 'scripts/mocks/expo-constants.ts'));

// Also ensure @ maps to src if needed
moduleAlias.addAlias('@', path.resolve(process.cwd(), 'src'));
