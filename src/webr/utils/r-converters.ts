import type { RObject } from 'webr'
import { isRCharacterVector, isRLogicalVector, isRNumericVector } from '../core/types'

/**
 * Convert R character vector to JavaScript string
 * @see https://docs.r-wasm.org/webr/latest/convert-js.html#converting-r-objects
 * 
 * Typical R character vector JS representation:
 * { type: 'character', values: ['string1', 'string2'] }
 */
export async function toCharacterVector(rObject: RObject): Promise<string | null> {
  try {
    const js = await rObject.toJs()
    if (isRCharacterVector(js)) {
      return js.values.join('\n')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract first string from R character vector
 */
export async function extractFirstString(rObject: RObject): Promise<string | null> {
  try {
    const js = await rObject.toJs()
    if (isRCharacterVector(js) && js.values.length > 0) {
      return js.values[0]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Convert R logical vector to boolean
 * Returns true only if first value is explicitly true
 */
export async function toBoolean(rObject: RObject): Promise<boolean> {
  try {
    const js = await rObject.toJs()
    if (isRLogicalVector(js) && js.values.length > 0) {
      return js.values[0] === true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Convert R numeric vector to number array
 */
export async function toNumericArray(rObject: RObject): Promise<number[] | null> {
  try {
    const js = await rObject.toJs()
    if (isRNumericVector(js)) {
      return js.values
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check the R type of an object
 * @see https://docs.r-wasm.org/webr/latest/objects.html#inspecting-r-objects
 */
export async function getRType(rObject: RObject): Promise<string | null> {
  try {
    return await rObject.type()
  } catch {
    return null
  }
}