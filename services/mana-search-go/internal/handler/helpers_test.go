package handler

import (
	"sync"

	"github.com/manacore/mana-search/internal/cache"
	"github.com/manacore/mana-search/internal/config"
	"github.com/manacore/mana-search/internal/metrics"
)

var (
	testMetrics *metrics.Metrics
	testCache   *cache.Cache
	testConfig  *config.Config
	initOnce    sync.Once
)

func testDeps() (*metrics.Metrics, *cache.Cache, *config.Config) {
	initOnce.Do(func() {
		testMetrics = metrics.New()
		testCache = &cache.Cache{}
		testConfig = &config.Config{}
	})
	return testMetrics, testCache, testConfig
}
