// Next's bundler resolves extensionless imports; plain `node --test` does not.
// One stdlib resolve hook bridges the gap so the checks need no test framework.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // fall through to the normal resolution and let it report the error
      }
    }
    return nextResolve(specifier, context);
  },
});
