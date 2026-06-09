package cache

type Client struct { Addr string; Namespace string }
func New(addr, namespace string) Client { return Client{Addr: addr, Namespace: namespace} }
