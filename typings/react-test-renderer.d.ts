declare module 'react-test-renderer' {
  import { ReactElement } from 'react';

  export interface ReactTestRendererJSON {
    type: string;
    props: { [propName: string]: any };
    children: null | ReactTestRendererJSON[];
  }

  export interface ReactTestRendererTree extends ReactTestRendererJSON {
    nodeType: 'component' | 'host';
    instance: any;
    rendered: null | ReactTestRendererTree;
  }

  export interface ReactTestInstance {
    instance: any;
    type: string | Function;
    props: { [propName: string]: any };
    parent: null | ReactTestInstance;
    children: Array<ReactTestInstance | string>;

    find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance;
    findByType(type: string | Function): ReactTestInstance;
    findByProps(props: { [propName: string]: any }): ReactTestInstance;
    findAll(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance[];
    findAllByType(type: string | Function): ReactTestInstance[];
    findAllByProps(props: { [propName: string]: any }): ReactTestInstance[];
  }

  export interface ReactTestRenderer {
    toJSON(): ReactTestRendererJSON | null;
    toTree(): ReactTestRendererTree | null;
    unmount(): void;
    update(nextElement: ReactElement): void;
    getInstance(): any;
    root: ReactTestInstance;
  }

  export interface TestRendererOptions {
    createNodeMock: (element: ReactElement) => any;
  }

  export function create(nextElement: ReactElement, options?: TestRendererOptions): ReactTestRenderer;
  export function act(callback: () => void | Promise<void>): Promise<void>;

  const _default: {
    create: typeof create;
    act: typeof act;
  };
  export default _default;
}
