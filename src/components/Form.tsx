import { IndexPath, Text } from '@ui-kitten/components'
import { useState } from 'react'
import { View, StyleSheet, GestureResponderEvent, Alert, TouchableHighlight } from 'react-native'
import { useMutation, useQuery } from 'react-query'
import { getData } from '../services/notion/common'
import { DateInput } from './DateInput'
import { Input } from './Input'
import { Select } from './Select'
import { FormData, getUpdatedFormState, resetForm } from '../utils/form'
import { CreateOutlayDTO } from '../dtos/create-outlay-dto'
import { createOutlay } from '../services/outlays/common'

const formStyles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '80%',
  },
})
const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
})
const submitButtonStyles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: 'white',
    width: 100,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
  },
})

const INITIAL_FORM_STATE: FormData = {
  name: {
    value: '',
    required: true,
    error: false,
  },
  date: {
    value: new Date(),
    required: false,
    error: false,
  },
  tags: {
    value: [],
    required: true,
    error: false,
  },
  price: {
    value: '',
    required: true,
    error: false,
  },
  paymentMethod: {
    value: undefined,
    required: true,
    error: false,
  },
}

const CREDIT_TYPES = ['International', 'National']

export const Form = () => {
  const createOutlayMutation = useMutation('d', createOutlay)
  const { data } = useQuery('data', getData)

  const [values, setValues] = useState<FormData>(INITIAL_FORM_STATE)

  const onDateChange = (selectedDate: Date) => {
    setValues({ ...values, date: { ...values.date, value: selectedDate } })
  }

  const onPriceChange = (price: string) => {
    const sanitizedPrice = price.match(/\d+/)
    const finalPrice = (sanitizedPrice ?? '').toString()
    setValues({ ...values, price: { ...values.price, value: finalPrice, error: !finalPrice } })
  }

  const [isSubmitPress, setIsSubmitPress] = useState(false)
  const onSubmitPress = async (e: GestureResponderEvent) => {
    const formState = getUpdatedFormState(values)
    setValues(formState.values)
    if (!formState.hasErrors) {
      const date = values.date.value.toISOString().split('T')[0]
      const sanitizedValues: CreateOutlayDTO = {
        name: values.name.value,
        date,
        tags: values.tags.value.map((tagIndex) => data.tags[tagIndex.row]),
        price: Number(values.price.value),
        paymentMethod: values.paymentMethod?.value && data.paymentMethods[values.paymentMethod.value.row],
      }
      const outlayData = await createOutlayMutation.mutateAsync(sanitizedValues)
      if (outlayData.data) {
        Alert.alert(`'${sanitizedValues.name}' outlay submitted!`)
        const resettedFormValues = resetForm(values, INITIAL_FORM_STATE)
        setValues(resettedFormValues)
      } else {
        Alert.alert(`'${outlayData.error}'. Try again later.`)
      }
    }
  }

  return (
    <View style={formStyles.container}>
      <Input
        value={values.name.value}
        label="Name"
        style={inputStyles.container}
        onChangeText={(text) => {
          setValues({ ...values, name: { ...values.name, value: text, error: !text } })
        }}
        required
        hasError={values.name.error}
      />
      <DateInput required label="Date" date={values.date.value} onChange={onDateChange} style={{ marginBottom: 20 }} />
      <Select
        onSelect={(tags: IndexPath[]) => {
          setValues({ ...values, tags: { ...values.tags, value: tags, error: !tags.length } })
        }}
        options={data?.tags ?? []}
        selectedIndex={values.tags.value}
        style={{ marginBottom: 20, borderRadius: 2 }}
        label="Tags"
        placeholder="Select Tags"
        required
        hasError={values.tags.error}
        multiSelect
      />
      <Input
        value={values.price.value}
        label="Price"
        style={inputStyles.container}
        onChangeText={onPriceChange}
        keyboardType="number-pad"
        required
        hasError={values.price.error}
      />
      <Select
        onSelect={(paymentMethod: IndexPath) =>
          setValues({
            ...values,
            paymentMethod: { ...values.paymentMethod, value: paymentMethod, error: !paymentMethod },
          })
        }
        options={data?.paymentMethods ?? []}
        selectedIndex={values.paymentMethod.value}
        style={{ marginBottom: 20, borderRadius: 2 }}
        label="Payment Method"
        placeholder="Select Payment Method"
        hasError={values.paymentMethod.error}
        required
      />
      <TouchableHighlight
        underlayColor="#3E7A85"
        onPress={onSubmitPress}
        style={submitButtonStyles.container}
        activeOpacity={1}
        onHideUnderlay={() => setIsSubmitPress(false)}
        onShowUnderlay={() => setIsSubmitPress(true)}
      >
        <Text style={{ color: isSubmitPress ? 'white' : 'black', fontFamily: 'Sono' }}>Submit</Text>
      </TouchableHighlight>
    </View>
  )
}
