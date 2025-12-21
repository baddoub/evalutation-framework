/**
 * Base interface for all use cases in the application layer.
 * Use cases orchestrate the flow of data to and from entities,
 * and direct those entities to use their business rules to achieve
 * the goals of the use case.
 *
 * @template Input - The input DTO type
 * @template Output - The output DTO type or Promise of output DTO
 */
export interface IUseCase<Input, Output> {
  /**
   * Execute the use case with the given input
   * @param input - The input data for the use case
   * @returns The result of the use case execution
   */
  execute(input: Input): Output | Promise<Output>
}
