import { LoadingState } from '@grafana/data';
import { HumioQueryResult } from 'query_result';

const mockGetInstanceSettings = jest.fn();
// @ts-ignore
const dataSourceSrv = { getInstanceSettings: mockGetInstanceSettings };

jest.mock('@grafana/runtime', () => ({
  // @ts-ignore
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: () => dataSourceSrv,
}));

describe('HumioQueryResult', () => {
  it('should return log data frames', () => {
    const result = new HumioQueryResult([mockLogEvent()], false, 'A', [], LoadingState.Done);
    const frames = result.toDataFrames();
    expect(frames.length).toBe(1);
    expect(frames[0].fields.length).toBe(3);
    const labels = frames[0].fields[1].labels ?? {};
    expect(labels['container']).toBeDefined();
  });

  it('should return metric data frame', () => {
    const result = new HumioQueryResult(mockMetricEvents(), true, 'A', [], LoadingState.Done);
    const frames = result.toDataFrames();
    expect(frames.length).toBe(1);
    expect(frames[0].fields.length).toBe(2);
    expect(frames[0].length).toBe(4);
  });

  it('should derive a field', () => {
    const result = new HumioQueryResult(
      [mockLogEvent()],
      false,
      'A',
      [
        {
          name: 'TraceID',
          matcherRegex: 'traceID=(\\w+)',
          url: 'http://localhost:16686/trace/${__value.raw}',
        },
      ],
      LoadingState.Done
    );
    const frames = result.toDataFrames();
    expect(frames.length).toBe(1);
    expect(frames[0].fields.length).toBe(4);
    expect(frames[0].fields[3].values.length).toBe(1);
    expect(frames[0].fields[3].values.get(0)).toBe('qwerty');
  });
});

function mockLogEvent() {
  return {
    name: '2be70aa3-de5e-4be4-8def-4de8987436de',
    '#type': 'kubernetes',
    timestamp: '2021-05-18T09:52:06.748663659Z',
    image: 'registry.netic.dk/dockerhub/calico/node:v3.19.0',
    source_type: 'kubernetes_logs',
    pod: 'calico-node-47pjl',
    cluster: 'netic-internal-prod1',
    'kubernetes.pod_ips[0]': '10.68.1.84',
    '@timezone': 'Z',
    '@timestamp.nanos': '0',
    'labels.pod-template-generation': '8',
    '@rawstring':
      '{"message":"{\\"cluster\\":\\"netic-internal-prod1\\",\\"container\\":\\"calico-node\\",\\"file\\":\\"/var/log/pods/calico-system_calico-node-47pjl_2be70aa3-de5e-4be4-8def-4de8987436de/calico-node/0.log\\",\\"image\\":\\"registry.netic.dk/dockerhub/calico/node:v3.19.0\\",\\"kubernetes\\":{\\"pod_ip\\":\\"10.68.1.84\\",\\"pod_ips\\":[\\"10.68.1.84\\"]},\\"labels\\":{\\"controller-revision-hash\\":\\"7f55f66794\\",\\"k8s-app\\":\\"calico-node\\",\\"pod-template-generation\\":\\"8\\"},\\"message\\":\\"2021-05-18 09:52:06.748 [INFO][51] felix/summary.go 100: Summarising 10 dataplane reconciliation loops over 1m2.4s: avg=6ms longest=21ms (resync-filter-v4)\\",\\"name\\":\\"2be70aa3-de5e-4be4-8def-4de8987436de\\",\\"namespace\\":\\"calico-system\\",\\"node\\":\\"prod1-dc1-worker00-fb600781\\",\\"pod\\":\\"calico-node-47pjl\\",\\"source_type\\":\\"kubernetes_logs\\",\\"stream\\":\\"stdout\\",\\"timestamp\\":\\"2021-05-18T09:52:06.748663659Z\\"}","source_type":"kafka"}',
    'kubernetes.pod_ip': '10.68.1.84',
    '@timestamp': 1621331526748,
    '@ingesttimestamp': '1621331528277',
    container: 'calico-node',
    '#repo': 'pd-main',
    'labels.controller-revision-hash': '7f55f66794',
    stream: 'stdout',
    message:
      '2021-05-18 09:52:06.748 [INFO][51] felix/summary.go 100: Summarising 10 dataplane reconciliation loops over 1m2.4s: avg=6ms longest=21ms (resync-filter-v4) traceID=qwerty',
    file: '/var/log/pods/calico-system_calico-node-47pjl_2be70aa3-de5e-4be4-8def-4de8987436de/calico-node/0.log',
    node: 'prod1-dc1-worker00-fb600781',
    namespace: 'calico-system',
    'labels.k8s-app': 'calico-node',
    '@id': 'zpti36P3jXKwvQDMyDN0BKxH_0_286_1621331526',
  };
}

function mockMetricEvents() {
  return [
    {
      container: 'cert-manager',
      _count: '2',
    },
    {
      container: 'calico-node',
      _count: '28',
    },
    {
      container: 'manager',
      _count: '24',
    },
    {
      container: 'calico-typha',
      _count: '2',
    },
  ];
}
