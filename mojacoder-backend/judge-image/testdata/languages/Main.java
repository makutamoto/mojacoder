import ac_library.DSU;
import java.math.BigInteger;
public class Main {
    public static void main(String[] args) {
        DSU groups = new DSU(3);
        groups.merge(0, 1);
        if (!groups.same(0, 1)) throw new AssertionError();
        System.out.println(BigInteger.valueOf(6).multiply(BigInteger.valueOf(7)));
    }
}
