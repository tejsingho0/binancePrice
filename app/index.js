import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [priceData, setPriceData] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const newData = {};
      
      // Filter for major USDT pairs
      const majorPairs = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX'];
      
      data.forEach(ticker => {
        const symbol = ticker.s.replace('USDT', '');
        if (ticker.s.endsWith('USDT') && majorPairs.includes(symbol)) {
          newData[ticker.s] = {
            symbol: ticker.s,
            price: parseFloat(ticker.c).toFixed(4),
            change: parseFloat(ticker.P).toFixed(2),
            time: new Date().toLocaleTimeString(),
            prevPrice: priceData[ticker.s]?.price || ticker.c
          };
        }
      });
      
      setPriceData(prev => ({ ...prev, ...newData }));
    };

    ws.onerror = (e) => {
      console.log('WebSocket error:', e.message);
      setIsConnected(false);
    };

    ws.onclose = (e) => {
      console.log('WebSocket disconnected:', e.code, e.reason);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const renderItem = ({ item }) => {
    const priceChangeColor = item.change >= 0 ? '#4CAF50' : '#F44336';
    const priceChangeIndicator = item.change >= 0 ? '↑' : '↓';
    const isUp = item.change >= 0;
    
    return (
      <View style={styles.card}>
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{item.symbol.replace('USDT', '/USDT')}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.price}</Text>
          <View style={[styles.changeContainer, { backgroundColor: isUp ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)' }]}>
            <Text style={[styles.change, { color: priceChangeColor }]}>
              {priceChangeIndicator} {Math.abs(item.change)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const data = Object.values(priceData).sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Binance Price Tracker</Text>
        <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.connectionText}>{isConnected ? 'LIVE' : 'DISCONNECTED'}</Text>
        </View>
      </View>
      
      {data.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Connecting to Binance...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.symbol}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6200ee',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  connectionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  list: {
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  symbolContainer: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  change: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
