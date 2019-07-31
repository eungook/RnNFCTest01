import React, { Component } from 'react';
import { Platform, Text, View } from 'react-native';
import NfcManager, { Ndef, } from 'react-native-nfc-manager';

export default class App extends Component {
  state = {
    isReady: false,
  }
  
  constructor(props) {
    super(props);
    this.initNFC();
  }

initNFC = async () => {
  const isNFCSupport = await getIsNFCSupport();
  console.warn('isNFCSupport:', isNFCSupport);
  if (isNFCSupport == false) {
    return false;
  }

  const isNFCEnabled = await getIsNFCEnabled();
  console.warn('isNFCEnabled:', isNFCEnabled);
  if (isNFCEnabled == false) {
    return false;
  }

  this.setState(state => ({ ...state, isReady: true }));

  this.registerTagEvent();

  async function getIsNFCSupport() {
    try {
      await NfcManager.start();
      await NfcManager.isSupported();
      return true;

    } catch (e) {
      return false;
    }
  }

  async function getIsNFCEnabled() {
    const isIOS = (Platform.OS == 'ios');
    if (isIOS) {
      return true;
    }

    try {
      const isNFCEnabled = await NfcManager.isEnabled();
      return isNFCEnabled;

    } catch (e) {
      return false;
    }
  }
}

  registerTagEvent = async () => {
    await NfcManager.registerTagEvent(
      this.onSuccessTagEvent,
      'Hold your device over the tag',
      {
        invalidateAfterFirstRead: true,
        isReaderModeEnabled: true,
        readerModeFlags: 0x1, // NfcAdapter.FLAG_READER_NFC_A
      }
    );
  }

  onSuccessTagEvent = async tag => {
    const parsed = tag.ndefMessage.map(decodeNdefRecord);
    parsed.forEach((item, i) => console.warn(`parsed[${i}]:`, item));

    function decodeNdefRecord(record) {
      if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
        return ['text', Ndef.text.decodePayload(record.payload)];

      } else if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
        return ['uri', Ndef.uri.decodePayload(record.payload)];

      } else {
        return ['unknown', '---'];
      }
    }
  }
  
  componentWillUnmount() {
    NfcManager.unregisterTagEvent();
    NfcManager.stop();
  }

  render() {
    return (
      <View>
        <Text>isReady: {(this.state.isReady) ? 'TRUE' : 'false'}</Text>
      </View>
    );
  }
}