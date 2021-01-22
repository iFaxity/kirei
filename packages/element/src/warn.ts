import { isString } from '@vue/shared';
import { getCurrentInstance } from './runtime/instance';
import type { ComponentInstance } from './types';

// Constants for stack trace
const INDENT_STEP = 2;
const INDENT = 4;

class KireiError extends Error {
  constructor(message: string, context?: string) {
    super();
    this.message = formatMessage(message, context);
    this.name = '[Kirei error]';
  }
}

/**
 * Creates an iterator to walk the instance tree
 * @param instance - Instance to walk up from
 * @returns A generator to walk the instance tree upwards
 * @private
 */
function *walkInstanceTree(instance: ComponentInstance): Generator<ComponentInstance> {
  while (instance) {
    yield instance;
    instance = instance.parent;
  }
}

/**
 * Formats element name from an instance
 * @param instance - Instance where stack trace should start
 * @param indent - Indenting of spaces before the message
 * @param recursiveCount - Amount of elements that are recursively called
 * @returns The element name as a formatted string
 * @private
 */
function formatComponentName(instance: ComponentInstance, indent: number, recursiveCount?: number): string {
  const { name, filename } = instance.options;
  let res = `${indent ? ' '.repeat(INDENT + INDENT_STEP * indent) : '--> '}<${name}>`;

  if (filename) {
    res += ` at ${filename}`;
  }

  if (recursiveCount) {
    res += `... (${recursiveCount} recursive calls)`;
  }
  return res;
}

/**
 * Creates a stack trace for error/warning messages
 * @param instance - Instance where stack trace should start
 * @returns Stack trace of the Kirei instance tree
 * @private
 */
function createStackTrace(instance: ComponentInstance): string {
  if (!instance.parent) {
    return `\n\n(found in <${instance.options.name}>)`;
  }

  const tree = [];
  let recursionCount = 0;

  for (const node of walkInstanceTree(instance)) {
    if (tree.length) {
      const prev = tree[tree.length - 1];

      if (prev.constructor === node.constructor) {
        recursionCount++;
        continue;
      } else if (recursionCount) {
        tree[tree.length - 1] = [prev, recursionCount];
        recursionCount = 0;
      }
    }

    tree.push(instance);
  }

  return `\n\nfound in:\n\n` + tree.map((res, idx) => {
    return Array.isArray(res)
      ? formatComponentName(res[0], idx, res[1])
      : formatComponentName(res, idx);
  }).join('\n');
}


/**
 * Creates a new KireiError instance
 * @param message - Error message
 * @param level - Logging level
 * @param context - Function context, if any
 * @private
 */
function formatMessage(message: string|Error, context?: string): string {
  const instance = getCurrentInstance();

  if (message instanceof Error) {
    message = message.message;
  }

  if (isString(context)) {
    if (message.endsWith('.')) {
      message = message.slice(0, -1);
    }

    message += ` in #${context}.`;
  }

  if (instance) {
    message += createStackTrace(instance);
  }

  return message;
}

/**
 * Throws an exception with a formatted message
 * @param message - Exception message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function exception(message: string|Error, context?: string): never {
  if (message instanceof KireiError) {
    throw message;
  } else if (message instanceof Error) {
    message = message.message;
  }

  throw new KireiError(message, context);
}

/**
 * Logs an error message in the console
 * @param message - Exception message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function error(message: string | Error, context?: string): void {
  console.error(`[Kirei error]: ${formatMessage(message, context)}`);
}

/**
 * Logs a warning message in the console
 * @param message - Warning message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function warn(message: string | Error, context?: string): void {
  console.warn(`[Kirei warn]: ${formatMessage(message, context)}`);
}
