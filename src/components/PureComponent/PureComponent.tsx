import { Component } from 'preact';

interface Obj {
    [key: string]: any;
}

export default abstract class PureComponent<P = {}, S = {}> extends Component<P, S> {
  private _shallowEqual(a: Obj, b: Obj) {
	for (const key in a) { if (a[key]!==b[key]) return false; }
	for (const key in b) { if (!(key in a)) return false; }
	return true;
  }

  public shouldComponentUpdate(props: P, state: S) {
    return !(this._shallowEqual(props, this.props) && this._shallowEqual(state, this.state));
  }
}


