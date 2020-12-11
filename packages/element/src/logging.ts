import { isString } from '@kirei/shared';
import type { IKireiInstance } from './interfaces';
import { getCurrentInstance, KireiInstance } from './instance';
import { execPath } from 'process';

// Constants for stack trace
const INDENT_STEP = 2;
const INDENT = 4;

/**
 * Error class for Kirei errors within the Kirei element
 * @private
 */
export class KireiError extends Error {
  /**
   * Error level, 'info', 'error 'or 'warn'
   */
  level: 'info'|'error'|'warn';

  /**
   * Function context of error, if any
   */
  context?: string;

  /**
   * Creates a new KireiError instance
   * @param message - Error message
   * @param level - Logging level
   * @param context - Function context, if any
   */
  constructor(message: string, level: 'info'|'error'|'warn', context?: string) {
    super();
    const instance = getCurrentInstance();

    if (isString(context)) {
      if (message.endsWith('.')) {
        message = message.slice(0, -1);
      }

      message += ` in #${context}.`;
      this.context = context;
    }

    if (instance) {
      message += this.createStackTrace(instance);
    }

    this.level = level;
    this.message = message;
    this.name = `[Kirei ${level}]`;
    Error.captureStackTrace?.(this, KireiError);
  }

  /**
   * Creates an iterator to walk the instance tree
   * @param instance - Instance to walk up from
   * @returns A generator to walk the instance tree upwards
   * @private
   */
  private *walkInstanceTree(instance: IKireiInstance): Generator<IKireiInstance> {
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
  private formatElementName(instance: KireiInstance, indent: number, recursiveCount?: number): string {
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
   */
  private createStackTrace(instance: KireiInstance): string {
    if (!instance.parent) {
      return `\n\n(found in <${instance.options.name}>)`;
    }
    const tree = [];
    let recursionCount = 0;

    for (let node of this.walkInstanceTree(instance)) {
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
        ? this.formatElementName(res[0], idx, res[1])
        : this.formatElementName(res, idx);
    }).join('\n');
  }
}

/**
 * Throws an exception with a formatted message
 * @param message - Exception message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function exception(message: string | Error, context?: string): never {
  throw new KireiError(message.toString(), 'error', context);
}

/**
 * Logs an error message in the console
 * @param message - Exception message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function error(message: string | Error, context?: string): void {
  console.error(new KireiError(message.toString(), 'error', context));
}

/**
 * Logs a warning message in the console
 * @param message - Warning message
 * @param context - Optional context (instance name, function name)
 * @private
 */
export function warn(message: string | Error, context?: string): void {
  console.warn(new KireiError(message.toString(), 'warn', context));
}
