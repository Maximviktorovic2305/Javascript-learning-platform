import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Exercise } from '../catalog/catalog.types';
@Injectable()
export class RunnerService {
  constructor(private readonly config: ConfigService) {}
  async execute(code: string, language: string, exercise: Exercise) {
    if (this.config.get<string>('EXECUTION_RUNNER') !== 'remote')
      throw new ServiceUnavailableException(
        'Серверная проверка сейчас отключена. Запуск примеров в браузере остаётся доступен.',
      );
    try {
      const response = await fetch(
        `${this.config.getOrThrow<string>('RUNNER_URL')}/execute`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.config.getOrThrow<string>('RUNNER_TOKEN')}`,
          },
          body: JSON.stringify({
            code,
            language,
            inputs: exercise.tests.map((test) => test.input),
          }),
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) throw new Error('Runner failed');
      const text = await response.text();
      if (text.length > 32000) throw new Error('Output limit');
      const result: unknown = JSON.parse(text);
      if (
        typeof result !== 'object' ||
        result === null ||
        !('ok' in result) ||
        typeof result.ok !== 'boolean'
      )
        throw new Error('Invalid runner response');
      if (!result.ok)
        return {
          ok: false as const,
          message:
            'error' in result && typeof result.error === 'string'
              ? result.error.slice(0, 2000)
              : 'Ошибка выполнения.',
          outputs: [] as unknown[],
        };
      if (
        !('outputs' in result) ||
        !Array.isArray(result.outputs) ||
        result.outputs.length !== exercise.tests.length
      )
        throw new Error('Invalid output count');
      return {
        ok: true as const,
        outputs: result.outputs as unknown[],
        message: '',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Исполнитель временно недоступен. Попробуйте позже.',
      );
    }
  }
}
