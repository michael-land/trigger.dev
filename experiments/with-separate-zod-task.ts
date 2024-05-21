import { z } from "zod";
import * as v from "valibot";

export type ParserZodEsque<TInput, TParsedInput> = {
  _input: TInput;
  _output: TParsedInput;
};

export type ParserMyZodEsque<TInput> = {
  parse: (input: any) => TInput;
};

export type ParserSuperstructEsque<TInput> = {
  create: (input: unknown) => TInput;
};

export type ParserCustomValidatorEsque<TInput> = (input: unknown) => Promise<TInput> | TInput;

export type ParserYupEsque<TInput> = {
  validateSync: (input: unknown) => TInput;
};

export type ParserScaleEsque<TInput> = {
  assert(value: unknown): asserts value is TInput;
};

export type ParserWithoutInput<TInput> =
  | ParserCustomValidatorEsque<TInput>
  | ParserMyZodEsque<TInput>
  | ParserScaleEsque<TInput>
  | ParserSuperstructEsque<TInput>
  | ParserYupEsque<TInput>;

export type ParserWithInputOutput<TInput, TParsedInput> = ParserZodEsque<TInput, TParsedInput>;

export type Parser = ParserWithInputOutput<any, any> | ParserWithoutInput<any>;

export type inferParser<TParser extends Parser> = TParser extends ParserWithInputOutput<
  infer $TIn,
  infer $TOut
>
  ? {
      in: $TIn;
      out: $TOut;
    }
  : TParser extends ParserWithoutInput<infer $InOut>
  ? {
      in: $InOut;
      out: $InOut;
    }
  : never;

export type Simplify<TType> = TType extends any[] | Date ? TType : { [K in keyof TType]: TType[K] };

export type TriggerResult = {
  id: string;
};

export type TaskRunResult<TOutput = any> =
  | {
      ok: true;
      id: string;
      output: TOutput;
    }
  | {
      ok: false;
      id: string;
      error: unknown;
    };

export type RunMetadata = {
  run: string;
};

export type RunFnParams<TPayload, TContext extends object> = {
  /** Metadata about the task, run, attempt, queue, environment, organization, project and batch.  */
  meta: RunMetadata;

  /** Context added by task middleware  */
  ctx: TContext;

  payload: TPayload;
};

export type TaskOptions<
  TPayloadIn,
  TPayloadOut,
  TOutput,
  TContext extends object,
  TIdentifier extends string,
> = {
  /** An id for your task. This must be unique inside your project and not change between versions.  */
  id: TIdentifier;

  schema?: Parser;

  /** This gets called when a task is triggered. It's where you put the code you want to execute.
   *
   * @param payload - The payload that is passed to your task when it's triggered. This must be JSON serializable.
   * @param params - Metadata about the run.
   */
  run: (
    params: Simplify<RunFnParams<inferTaskPayloadOut<TPayloadIn, TPayloadOut>, TContext>>
  ) => Promise<TOutput>;
};

export interface Task<TPayloadIn, TPayloadOut, TOutput, TIdentifier extends string> {
  /**
   * The id of the task.
   */
  id: TIdentifier;
  /**
   * Trigger a task with the given payload, and continue without waiting for the result. If you want to wait for the result, use `triggerAndWait`. Returns the id of the triggered task run.
   * @param payload
   * @param options
   * @returns TriggerResult
   * - `id` - The id of the triggered task run.
   */
  trigger: (
    payload: Simplify<inferTaskPayloadIn<TPayloadIn, TPayloadOut>>,
    options?: TriggerTaskOptions
  ) => Promise<TriggerResult>;

  /**
   * Trigger a task with the given payload, and wait for the result. Returns the result of the task run
   * @param payload
   * @param options - Options for the task run
   * @returns TaskRunResult
   * @example
   * ```
   * const result = await task.triggerAndWait({ foo: "bar" });
   *
   * if (result.ok) {
   *  console.log(result.output);
   * } else {
   *  console.error(result.error);
   * }
   * ```
   */
  triggerAndWait: (
    payload: Simplify<inferTaskPayloadIn<TPayloadIn, TPayloadOut>>,
    options?: TriggerTaskOptions
  ) => Promise<TaskRunResult<TOutput>>;
}

export type AnyTask = Task<any, any, any, string>;

type IsUnknown<T> = unknown extends T ? (T extends unknown ? true : false) : false;
type NonUnknown<T> = IsUnknown<T> extends true ? never : T;

export type inferTaskPayloadIn<TPayloadIn, TPayloadOut> = NonUnknown<TPayloadIn> extends never
  ? TPayloadOut
  : TPayloadIn;
export type inferTaskPayloadOut<TPayloadIn, TPayloadOut> = NonUnknown<TPayloadOut> extends never
  ? TPayloadIn
  : TPayloadOut;

export type TaskPayloadIn<TTask extends AnyTask> = TTask extends Task<
  infer TPayloadIn,
  infer TPayloadOut,
  any,
  string
>
  ? inferTaskPayloadIn<TPayloadIn, TPayloadOut>
  : never;

export type TaskPayloadOut<TTask extends AnyTask> = TTask extends Task<
  infer TPayloadIn,
  infer TPayloadOut,
  any,
  string
>
  ? inferTaskPayloadOut<TPayloadIn, TPayloadOut>
  : never;

export type TaskOutput<TTask extends AnyTask> = TTask extends Task<any, any, infer TOutput, string>
  ? TOutput
  : never;

export type TaskIdentifier<TTask extends AnyTask> = TTask extends Task<
  any,
  any,
  any,
  infer TIdentifier
>
  ? TIdentifier
  : never;

export type TaskTypes<TTask extends AnyTask> = TTask extends Task<
  infer TPayloadIn,
  infer TPayloadOut,
  infer TOutput,
  infer TIdentifier
>
  ? {
      id: TIdentifier;
      payloadIn: TPayloadIn;
      payloadOut: TPayloadOut;
      output: TOutput;
    }
  : never;

export type TriggerTaskOptions = {
  idempotencyKey?: string;
  maxAttempts?: number;
  startAt?: Date;
  startAfter?: number;
  concurrencyKey?: string;
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export function task<
  TPayloadIn,
  TPayloadOut,
  TOutput,
  TContext extends object,
  TIdentifier extends string,
>(
  options: TaskOptions<TPayloadIn, TPayloadOut, TOutput, TContext, TIdentifier>
): Task<TPayloadIn, TPayloadOut, TOutput, TIdentifier> {
  return createTask<TPayloadIn, TPayloadOut, TOutput, TContext, TIdentifier>(options);
}

export function createTask<
  TPayloadIn,
  TPayloadOut,
  TOutput,
  TContext extends object,
  TIndentifier extends string,
>(
  params: TaskOptions<TPayloadIn, TPayloadOut, TOutput, TContext, TIndentifier>
): Task<TPayloadIn, TPayloadOut, TOutput, TIndentifier> {
  const task: Task<TPayloadIn, TPayloadOut, TOutput, TIndentifier> = {
    id: params.id,
    trigger: async (payload, options) => {
      return {
        id: "run_1234",
      };
    },
    triggerAndWait: async (payload, options) => {
      const output = await params.run({
        meta: { run: "run_1234" },
        payload: payload as unknown as inferTaskPayloadOut<TPayloadIn, TPayloadOut>,
        ctx: {} as TContext,
      });

      return {
        ok: true,
        id: "run_1234",
        output,
      };
    },
  };

  return task;
}

export type ZodTaskOptions<
  TOutput,
  TContext extends object,
  TIdentifier extends string,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  schema: TSchema;
} & TaskOptions<z.input<TSchema>, z.output<TSchema>, TOutput, TContext, TIdentifier>;

export function zodTask<
  TOutput,
  TContext extends object,
  TIdentifier extends string,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
>(
  options: ZodTaskOptions<TOutput, TContext, TIdentifier, TSchema>
): Task<z.input<TSchema>, z.output<TSchema>, TOutput, TIdentifier> {
  return createTask<z.input<TSchema>, z.output<TSchema>, TOutput, TContext, TIdentifier>(options);
}

export type ValibotTaskOptions<
  TOutput,
  TContext extends object,
  TIdentifier extends string,
  TSchema extends v.BaseSchema = v.AnySchema,
> = {
  schema: TSchema;
} & TaskOptions<v.Input<TSchema>, v.Output<TSchema>, TOutput, TContext, TIdentifier>;

export function valibotTask<
  TOutput,
  TContext extends object,
  TIdentifier extends string,
  TSchema extends v.BaseSchema = v.AnySchema,
>(
  options: ValibotTaskOptions<TOutput, TContext, TIdentifier, TSchema>
): Task<v.Input<TSchema>, v.Output<TSchema>, TOutput, TIdentifier> {
  return createTask<v.Input<TSchema>, v.Output<TSchema>, TOutput, TContext, TIdentifier>(options);
}

export interface TaskLibraryRecord {
  [key: string]: AnyTask | TaskLibraryRecord;
}

export interface TaskLibrary<TRecord extends TaskLibraryRecord> {
  _def: { record: TRecord };
}

export type AnyTaskLibrary = TaskLibrary<any>;

export type CreateTaskLibraryOptions = {
  [key: string]: AnyTask | AnyTaskLibrary | CreateTaskLibraryOptions;
};

export type DecorateCreateTaskLibraryOptions<TTaskLibraryOptions extends CreateTaskLibraryOptions> =
  {
    [K in keyof TTaskLibraryOptions]: TTaskLibraryOptions[K] extends infer $Value
      ? $Value extends AnyTask
        ? $Value
        : $Value extends TaskLibrary<infer TRecord>
        ? TRecord
        : $Value extends CreateTaskLibraryOptions
        ? DecorateCreateTaskLibraryOptions<$Value>
        : never
      : never;
  };

function taskLibrary<TInput extends CreateTaskLibraryOptions>(
  input: TInput
): TaskLibrary<DecorateCreateTaskLibraryOptions<TInput>>;
function taskLibrary<TInput extends TaskLibraryRecord>(input: TInput): TaskLibrary<TInput>;
function taskLibrary(input: TaskLibraryRecord | CreateTaskLibraryOptions) {
  // TODO: reserved words

  return {
    _def: {
      record: input,
    },
  };
}

// ======== client side
type DecorateTask<TTask extends AnyTask> = {
  trigger: (id: TaskIdentifier<TTask>, payload: TaskPayloadIn<TTask>) => Promise<{ id: string }>;
};

type DecoratedTaskLibraryRecord<
  TTaskLibrary extends AnyTaskLibrary,
  TRecord extends TaskLibraryRecord,
> = {
  [TKey in keyof TRecord]: TRecord[TKey] extends infer $Value
    ? $Value extends TaskLibraryRecord
      ? DecoratedTaskLibraryRecord<TTaskLibrary, $Value>
      : $Value extends AnyTask
      ? DecorateTask<$Value>
      : never
    : never;
};

export type inferTaskLibraryClient<TTaskLibrary extends AnyTaskLibrary> =
  DecoratedTaskLibraryRecord<TTaskLibrary, TTaskLibrary["_def"]["record"]>;

export type CreateTriggerClient<TTaskLibrary extends AnyTaskLibrary> = {
  lib: inferTaskLibraryClient<TTaskLibrary>;
  runs: {
    retrieve: (id: string) => Promise<{ status: boolean }>;
  };
};

export type CreateTriggerClientOptions = {
  secretKey?: string;
};

export function createTriggerClient<TTaskLibrary extends AnyTaskLibrary>(
  options?: CreateTriggerClientOptions
): CreateTriggerClient<TTaskLibrary> {
  return {} as CreateTriggerClient<TTaskLibrary>;
}

// trigger/my-tasks.ts
const taskOne = task({
  id: "task-1",
  run: async () => {
    const handle = await taskTwo.trigger({ url: "https://trigger.dev" });
    const result = await taskTwo.triggerAndWait({ url: "https://trigger.dev" });

    return "foo-bar";
  },
});

const taskTwo = task({
  id: "task-2",
  async run(params) {
    return {
      hello: "world",
      payload: params.payload,
    };
  },
});

const userTaskOne = task({
  id: "user/task-1",
  run: async (params: { payload: { userId: string } }) => {
    return "foo-bar";
  },
});

const userTaskTwo = task({
  id: "user/task-2",
  run: async (params: { payload: { userId: string; isAdmin: boolean } }) => {
    return "foo-bar";
  },
});

const zodTaskOne = task({
  id: "zod/task-1",
  schema: z.object({ foo: z.string() }),
  run: async (params) => {},
});

const zodTaskTwo = task({
  id: "zod/task-2",
  schema: z.object({ foo: z.string(), isAdmin: z.boolean().default(false) }),
  run: async (params) => {
    console.log(params.payload.foo, params.meta.run);
  },
});

const valibotTaskOne = task({
  id: "valibot/task-1",
  schema: v.object({
    foo: v.string(),
  }),
  run: async (params) => {
    await zodTaskOne.trigger({ foo: "bar" });
    await zodTaskTwo.trigger({ foo: "bar" });

    await valibotTaskTwo.trigger({ foo: "bar" });
  },
});

const valibotTaskTwo = task({
  id: "valibot/task-2",
  schema: v.object({
    foo: v.string(),
    isAdmin: v.optional(v.boolean(), true),
  }),
  run: async (params) => {
    await valibotTaskOne.trigger({ foo: "bar" });
  },
});

// in trigger/lib.ts
const myTaskLibrary = taskLibrary({
  myTasks: { taskOne, taskTwo },
});

const userTaskLibrary = taskLibrary({
  userTaskOne,
  userTaskTwo,
});

const zodTaskLibrary = taskLibrary({
  zodTaskOne,
  zodTaskTwo,
});

const valibotTaskLibrary = taskLibrary({
  valibotTaskOne,
  valibotTaskTwo,
});

export const library = taskLibrary({
  foo: myTaskLibrary,
  bar: userTaskLibrary,
  zod: zodTaskLibrary,
  valibot: valibotTaskLibrary,
});

// Export the library type
export type Library = typeof library;

// Now on the client
const client = createTriggerClient<Library>({
  secretKey: "tr_dev_1234",
});

client.runs.retrieve("run_12343"); // Call regular API client calls

// Tasks are now available under lib
client.lib.foo.myTasks.taskOne.trigger("task-1", { hello: "world" });
client.lib.bar.userTaskOne.trigger("user/task-1", { userId: "user_123" });
client.lib.bar.userTaskTwo.trigger("user/task-2", { userId: "user_123", isAdmin: true });
client.lib.bar.userTaskTwo.trigger("user/task-2", { userId: "user_123", isAdmin: false });
client.lib.zod.zodTaskOne.trigger("zod/task-1", { foo: "bar" });
client.lib.zod.zodTaskTwo.trigger("zod/task-2", { foo: "bar" });
client.lib.zod.zodTaskTwo.trigger("zod/task-2", { foo: "bar", isAdmin: false });
client.lib.valibot.valibotTaskTwo.trigger("valibot/task-2", { foo: "bar" });
client.lib.valibot.valibotTaskTwo.trigger("valibot/task-2", { foo: "bar", isAdmin: false });
