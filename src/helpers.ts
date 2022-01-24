/**
 * Performs a deep mutation of an existing object to equal a given source object.
 *
 * Adapted from this package: https://github.com/jeremyhewett/mutate-object
 * @param {object} destination - The object to mutate
 * @param {object} source - The object that the destination should be mutated to equal
 * @param {boolean} [preserveRootProps=true] - Whether undefined props on the root level should be deleted
 */
export function mutateObject(
    destination: any,
    source: any,
    preserveRootProps: boolean = false,
): void {
    if (isEnumerable(source)) {
        const isSrcArray = Array.isArray(source);
        destination =
            (isEnumerable(destination) &&
                Array.isArray(destination) === isSrcArray &&
                destination) ||
            (isSrcArray ? [] : {});

        if (!preserveRootProps) {
            isSrcArray
                ? cleanArray(destination, source)
                : cleanObject(destination, source);
        }

        if (isSrcArray) {
            source.map((value, i) => {
                if (destination.length < i + 1) {
                    destination.push();
                }
                destination[i] = mutateObject(destination[i], value, false);
            });
        } else {
            for (let i in source) {
                if (source.hasOwnProperty(i)) {
                    destination[i] = mutateObject(
                        destination[i],
                        source[i],
                        false,
                    );
                }
            }
        }

        return destination;
    }

    return source;
}

function isEnumerable(value: unknown) {
    return value !== null && typeof value === "object";
}

function cleanArray(oldArray: any[], newArray: any[]) {
    if (newArray.length < oldArray.length) {
        oldArray.splice(newArray.length, oldArray.length - newArray.length);
    }
    return oldArray;
}

function cleanObject(oldObj: any, newObj: any) {
    for (let prop in oldObj) {
        if (oldObj.hasOwnProperty(prop) && !newObj.hasOwnProperty(prop)) {
            delete oldObj[prop];
        }
    }
}
